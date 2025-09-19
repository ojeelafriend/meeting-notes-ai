import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";
import ffmpegStatic from "ffmpeg-static";
import { spawn } from "node:child_process";
import fs, { mkdir, access } from "node:fs/promises";
import path from "node:path";

type SplitParams = {
  inputPath: string; // e.g. "./input.mp4"
  outputDir: string; // e.g. "./chunks"
  segmentSeconds: number; // e.g. 60
  filePrefix?: string; // e.g. "part" -> part_000.mp4
};

type SplitResult = {
  message: string;
  error: string | null;
};

export async function splitVideo({
  inputPath,
  outputDir,
  segmentSeconds,
  filePrefix = "part",
}: SplitParams): Promise<SplitResult> {
  try {
    if (!inputPath) return { message: "", error: "inputPath is required" };
    if (!outputDir) return { message: "", error: "outputDir is required" };
    if (!segmentSeconds || segmentSeconds <= 0) {
      return { message: "", error: "segmentSeconds must be greater than 0" };
    }

    const ABSOLUTE_OUTPUT_DIR = path.join(
      process.cwd(),
      `uploads/${outputDir}`
    );

    console.log(ABSOLUTE_OUTPUT_DIR);

    await fs.mkdir(ABSOLUTE_OUTPUT_DIR, { recursive: true });

    const ext = path.extname(inputPath) || ".mp4";
    const template = path.join(ABSOLUTE_OUTPUT_DIR, `${filePrefix}_%03d${ext}`);

    const args = [
      "-y",
      "-i",
      inputPath,
      "-map",
      "0",
      "-f",
      "segment",
      "-segment_time",
      String(segmentSeconds),
      "-reset_timestamps",
      "1",
      "-c",
      "copy",
      template,
    ];

    await new Promise<void>((resolve, reject) => {
      const p = spawn(ffmpegPath.path, args, { stdio: "inherit" });
      p.on("error", reject);
      p.on("close", (code) =>
        code === 0
          ? resolve()
          : reject(new Error(`ffmpeg exited with code ${code}`))
      );
    });

    return { message: "Video split completed successfully.", error: null };
  } catch (err: any) {
    return { message: "", error: err?.message || String(err) };
  }
}

type GetPathsParams = {
  outputDir: string; // ej: "/app/chunks/abcd1234"
  filePrefix?: string; // ej: "part" => part_000.ext (default: "part")
};

type GetPathsResult = {
  paths: string[];
  error: string | null;
};

function escapeForRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Lista todos los archivos que matcheen `filePrefix_%03d.<ext>` en `outputDir`,
 * ordenados por el índice (000, 001, 002, ...). No requiere extensión.
 */
export async function getSegmentPaths({
  outputDir,
  filePrefix = "part",
}: GetPathsParams): Promise<GetPathsResult> {
  try {
    if (!outputDir) return { paths: [], error: "outputDir is required" };

    const ABSOLUTE_OUTPUT_DIR = path.join(
      process.cwd(),
      `uploads/${outputDir}`
    );

    const absOutDir = path.resolve(ABSOLUTE_OUTPUT_DIR);
    const files = await fs.readdir(absOutDir);

    const prefixEsc = escapeForRegex(filePrefix);
    // Cualquier extensión alfanumérica: .mp4, .m4a, .mp3, .wav, .webm, .mov, .mkv, etc.
    const pattern = new RegExp(`^${prefixEsc}_(\\d{3})\\.[A-Za-z0-9]+$`);

    const matched = files
      .map((name) => {
        const m = name.match(pattern);
        if (!m) return null;
        const idx = Number(m[1]); // "003" -> 3
        return { name, idx };
      })
      .filter((x): x is { name: string; idx: number } => !!x)
      .sort((a, b) => a.idx - b.idx)
      .map(({ name }) => path.join(absOutDir, name));

    return { paths: matched, error: null };
  } catch (err: any) {
    return { paths: [], error: err?.message || String(err) };
  }
}

// ffmpeg-silence-split.ts
// ------------------------------------------------------------
// Detecta silencios con FFmpeg, "snappea" cortes a pausas,
// y exporta segmentos de audio precisos (WAV 16k mono, pcm_s16le).
// Opcional: genera MP4s (vista) por segmento.
//
// Reqs:
//   npm i ffmpeg-static @ffprobe-installer/ffprobe
//
// Uso rápido:
//   import { cutBySilence } from "./ffmpeg-silence-split";
//   const res = await cutBySilence({ inputPath: "in.mp4", outputDir: "out", segmentSeconds: 60 });
//   console.log(res.message, res.wavPaths);
//
// ------------------------------------------------------------

type Silence = { start: number; end: number; duration: number };
type CutPlan = { start: number; end: number; idx: number };

const FFMPEG_BIN = ffmpegStatic as string;
const FFPROBE_BIN = ffprobeInstaller.path;

function run(bin: "ffmpeg" | "ffprobe", args: string[], captureStdout = false) {
  const cmd = bin === "ffmpeg" ? FFMPEG_BIN : FFPROBE_BIN;
  return new Promise<{ code: number; out: string; err: string }>(
    (resolve, reject) => {
      const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
      let out = "",
        err = "";
      p.stdout.on("data", (d) => {
        if (captureStdout) out += d.toString();
      });
      p.stderr.on("data", (d) => {
        err += d.toString();
      });
      p.on("error", reject);
      p.on("close", (code) => resolve({ code: code ?? 0, out, err }));
    }
  );
}

async function ffprobeDuration(absInput: string): Promise<number> {
  const { code, out } = await run(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      absInput,
    ],
    true
  );
  if (code !== 0) throw new Error("ffprobe failed");
  const dur = parseFloat((out || "").trim());
  if (!isFinite(dur)) throw new Error("Invalid duration from ffprobe");
  return dur;
}

async function detectSilences(
  absInput: string,
  noise = "-30dB",
  minSilenceSec = 0.35
): Promise<Silence[]> {
  const { err } = await run("ffmpeg", [
    "-hide_banner",
    "-i",
    absInput,
    "-af",
    `silencedetect=noise=${noise}:d=${minSilenceSec}`,
    "-f",
    "null",
    "-",
  ]);
  const silences: Silence[] = [];
  let pendingStart: number | null = null;
  for (const ln of err.split(/\r?\n/)) {
    const m1 = ln.match(/silence_start:\s*([0-9.]+)/);
    if (m1) {
      pendingStart = parseFloat(m1[1]);
      continue;
    }
    const m2 = ln.match(
      /silence_end:\s*([0-9.]+)\s*\|\s*silence_duration:\s*([0-9.]+)/
    );
    if (m2 && pendingStart != null) {
      const end = parseFloat(m2[1]);
      const dur = parseFloat(m2[2]);
      silences.push({ start: pendingStart, end, duration: dur });
      pendingStart = null;
    }
  }
  return silences.sort((a, b) => a.start - b.start);
}

function snapBoundariesBySilence(opts: {
  duration: number;
  targetSec: number;
  silences: Silence[];
  windowSec?: number;
  minGapSec?: number;
  prefer?: "end" | "start" | "both";
}): number[] {
  const { duration, targetSec, silences } = opts;
  const windowSec = opts.windowSec ?? 2.0;
  const minGapSec = opts.minGapSec ?? 5.0;
  const prefer = opts.prefer ?? "end";

  const targets: number[] = [];
  for (let t = targetSec; t < duration; t += targetSec) targets.push(t);

  let silencePoints: number[] = [];
  if (prefer === "end") silencePoints = silences.map((s) => s.end);
  else if (prefer === "start") silencePoints = silences.map((s) => s.start);
  else silencePoints = silences.flatMap((s) => [s.start, s.end]);
  silencePoints.sort((a, b) => a - b);

  const bounds: number[] = [0];
  let last = 0;

  for (const t of targets) {
    let best = t;
    let bestDist = Infinity;
    for (const s of silencePoints) {
      if (s < t - windowSec) continue;
      if (s > t + windowSec) break;
      const d = Math.abs(s - t);
      if (d < bestDist) {
        bestDist = d;
        best = s;
      }
    }
    const candidate = bestDist === Infinity ? t : best;
    if (candidate - last >= minGapSec) {
      bounds.push(candidate);
      last = candidate;
    }
  }

  if (duration - last >= 0.1) bounds.push(duration);
  return Array.from(new Set(bounds.map((n) => +n.toFixed(3)))).sort(
    (a, b) => a - b
  );
}

async function cutAudioPreciseWav(
  absInput: string,
  start: number,
  end: number,
  outWav: string
) {
  const args = [
    "-hide_banner",
    "-i",
    absInput, // decode primero
    "-ss",
    String(start), // seek preciso
    "-to",
    String(end),
    "-vn",
    "-sn",
    "-af",
    "aresample=async=1:first_pts=0",
    "-ar",
    "16000",
    "-ac",
    "1",
    "-c:a",
    "pcm_s16le",
    "-y",
    outWav,
  ];
  const { code, err } = await run("ffmpeg", args);
  if (code !== 0)
    throw new Error(
      `ffmpeg audio cut failed: ${err.split("\n").slice(-8).join("\n")}`
    );
}

async function cutMp4Segment(
  absInput: string,
  start: number,
  end: number,
  outMp4: string,
  precise = false
) {
  const args = precise
    ? [
        "-hide_banner",
        "-i",
        absInput,
        "-ss",
        String(start),
        "-to",
        String(end),
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "22",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-movflags",
        "+faststart",
        "-y",
        outMp4,
      ]
    : [
        "-hide_banner",
        "-ss",
        String(start),
        "-to",
        String(end),
        "-i",
        absInput,
        "-c",
        "copy",
        "-copyts",
        "-avoid_negative_ts",
        "make_zero",
        "-movflags",
        "+faststart",
        "-y",
        outMp4,
      ];
  const { code, err } = await run("ffmpeg", args);
  if (code !== 0)
    throw new Error(
      `ffmpeg mp4 cut failed: ${err.split("\n").slice(-8).join("\n")}`
    );
}

export async function cutBySilence(params: {
  inputPath: string; // puede ser relativo
  jobId: string; // carpeta dentro de uploads (no pongas 'uploads/')
  segmentSeconds: number;
  filePrefix?: string;
  snapWindowSec?: number;
  minGapSec?: number;
  paddingSec?: number;
  preferBoundary?: "end" | "start" | "both";
  noiseThreshold?: string;
  minSilenceSec?: number;
  emitMp4?: boolean;
  mp4Precise?: boolean;
}): Promise<{
  wavPaths: string[];
  mp4Paths: string[];
  outDir: string;
  message: string;
  error: string | null;
}> {
  try {
    const {
      inputPath,
      jobId,
      segmentSeconds,
      filePrefix = "part",
      snapWindowSec = 2.0,
      minGapSec = 5.0,
      paddingSec = 0.25,
      preferBoundary = "end",
      noiseThreshold = "-30dB",
      minSilenceSec = 0.35,
      emitMp4 = false,
      mp4Precise = false,
    } = params;

    if (!inputPath)
      return {
        wavPaths: [],
        mp4Paths: [],
        outDir: "",
        message: "",
        error: "inputPath is required",
      };
    if (!jobId)
      return {
        wavPaths: [],
        mp4Paths: [],
        outDir: "",
        message: "",
        error: "jobId is required",
      };
    if (!segmentSeconds || segmentSeconds <= 0)
      return {
        wavPaths: [],
        mp4Paths: [],
        outDir: "",
        message: "",
        error: "segmentSeconds must be > 0",
      };
    if (!FFMPEG_BIN || !FFPROBE_BIN)
      return {
        wavPaths: [],
        mp4Paths: [],
        outDir: "",
        message: "",
        error: "ffmpeg/ffprobe bins not available",
      };

    // RUTAS ABSOLUTAS
    const CWD = process.cwd();
    const ABS_INPUT = path.isAbsolute(inputPath)
      ? inputPath
      : path.join(CWD, inputPath);
    const UPLOADS_ROOT = path.join(CWD, "uploads");
    const OUT_DIR = path.join(UPLOADS_ROOT, jobId);

    // mkdir asegurado
    await mkdir(UPLOADS_ROOT, { recursive: true });
    await mkdir(OUT_DIR, { recursive: true });

    // sanity check
    await access(OUT_DIR).catch(() => {
      throw new Error(`Cannot access output dir: ${OUT_DIR}`);
    });

    const duration = await ffprobeDuration(ABS_INPUT);
    const silences = await detectSilences(
      ABS_INPUT,
      noiseThreshold,
      minSilenceSec
    );

    const boundaries = snapBoundariesBySilence({
      duration,
      targetSec: segmentSeconds,
      silences,
      windowSec: snapWindowSec,
      minGapSec,
      prefer: preferBoundary,
    });

    const cuts: CutPlan[] = [];
    for (let i = 0; i < boundaries.length - 1; i++) {
      const rawStart = boundaries[i];
      const rawEnd = boundaries[i + 1];
      const start = Math.max(0, rawStart - (i === 0 ? 0 : paddingSec));
      const end = Math.min(
        duration,
        rawEnd + (i === boundaries.length - 2 ? 0 : paddingSec)
      );
      if (end - start >= 0.25) cuts.push({ start, end, idx: i });
    }

    const wavPaths: string[] = [];
    const mp4Paths: string[] = [];

    for (const c of cuts) {
      const base = `${filePrefix}_${String(c.idx).padStart(3, "0")}`;
      const outWav = path.join(OUT_DIR, `${base}.wav`);
      await cutAudioPreciseWav(ABS_INPUT, c.start, c.end, outWav);
      wavPaths.push(outWav);

      if (emitMp4) {
        const ext = path.extname(ABS_INPUT) || ".mp4";
        const outMp4 = path.join(OUT_DIR, `${base}${ext}`);
        await cutMp4Segment(ABS_INPUT, c.start, c.end, outMp4, mp4Precise);
        mp4Paths.push(outMp4);
      }
    }

    // si el archivo dura menos que segmentSeconds, igual habrá 1 segmento (0 → duration)
    if (wavPaths.length === 0) {
      const outWav = path.join(OUT_DIR, `${filePrefix}_000.wav`);
      await cutAudioPreciseWav(ABS_INPUT, 0, duration, outWav);
      wavPaths.push(outWav);
      if (emitMp4) {
        const ext = path.extname(ABS_INPUT) || ".mp4";
        const outMp4 = path.join(OUT_DIR, `${filePrefix}_000${ext}`);
        await cutMp4Segment(ABS_INPUT, 0, duration, outMp4, mp4Precise);
        mp4Paths.push(outMp4);
      }
    }

    return {
      wavPaths,
      mp4Paths,
      outDir: OUT_DIR,
      message: `Split OK: ${wavPaths.length} segmento(s). Carpeta: ${OUT_DIR}`,
      error: null,
    };
  } catch (e: any) {
    return {
      wavPaths: [],
      mp4Paths: [],
      outDir: "",
      message: "",
      error: e?.message || String(e),
    };
  }
}
