import ffmpegStatic from "ffmpeg-static";
import path from "path";
import { spawn } from "child_process";

type FileLike = { path: string; originalname: string; mimetype?: string };

const SUPPORTED_EXTS = new Set([
  ".mp3",
  ".mp4",
  ".mpeg",
  ".mpga",
  ".m4a",
  ".wav",
  ".webm",
]);

// ---------- helpers ----------
function ext(name: string) {
  return (path.extname(name || "") || "").toLowerCase();
}

function replaceExt(p: string, newExt: string) {
  const dot = p.lastIndexOf(".");
  return dot === -1 ? p + newExt : p.slice(0, dot) + newExt;
}

function isSupported(file: FileLike) {
  return SUPPORTED_EXTS.has(ext(file.originalname));
}

function isWhatsAppOpus(file: FileLike) {
  const e = ext(file.originalname);
  return e === ".ogg" || e === ".opus";
}

function isIphoneMov(file: FileLike) {
  return ext(file.originalname) === ".mov";
}

function runFfmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const ps = spawn(ffmpegStatic as string, args, { stdio: "inherit" });
    ps.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`))
    );
  });
}

// ---------- transforms ----------
async function ffmpegToAacMono16k(input: string, output: string) {
  await runFfmpeg([
    "-y",
    "-i",
    input,
    "-ac",
    "1",
    "-ar",
    "16000",
    "-c:a",
    "aac",
    "-b:a",
    "64k",
    output,
  ]);
}

async function ffmpegToMp3Mono16k(input: string, output: string) {
  await runFfmpeg([
    "-y",
    "-i",
    input,
    "-ac",
    "1",
    "-ar",
    "16000",
    "-codec:a",
    "libmp3lame",
    "-b:a",
    "80k",
    output,
  ]);
}

async function extractAudioCopyOrTranscode(input: string, output: string) {
  // 1) Intentar copiar el track de audio (rápido, sin pérdida)
  try {
    await runFfmpeg(["-y", "-i", input, "-vn", "-c:a", "copy", output]);
    return;
  } catch {
    // 2) Si falla, convertir a AAC mono 16k
    await ffmpegToAacMono16k(input, output);
  }
}

// ---------- main ----------
/**
 * Devuelve el path de un archivo listo para Whisper.
 * - Si el formato ya está soportado → devuelve el original.
 * - WhatsApp (.ogg/.opus) → convierte a .m4a (AAC mono 16k).
 * - iPhone video (.mov) → extrae audio a .m4a (copy o AAC mono 16k).
 * - Resto no soportado → convierte a .mp3 (mono 16k).
 */
export async function normalizeFile(file: FileLike): Promise<string> {
  if (isSupported(file)) {
    return file.path;
  }

  if (isWhatsAppOpus(file)) {
    const out = replaceExt(file.path, ".m4a");
    await ffmpegToAacMono16k(file.path, out);
    return out;
  }

  if (isIphoneMov(file)) {
    const out = replaceExt(file.path, ".m4a");
    await extractAudioCopyOrTranscode(file.path, out);
    return out;
  }

  const out = replaceExt(file.path, ".mp3");
  await ffmpegToMp3Mono16k(file.path, out);
  return out;
}
