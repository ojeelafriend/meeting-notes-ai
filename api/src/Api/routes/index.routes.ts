import express, { Request, Response, Express } from "express";
import multer from "multer";
import path from "path";
import {
  summarize,
  transcribe,
} from "../../Shared/framework/openai/transcripter";
import { extractTitle } from "../../Shared/utils";
import bcrypt from "bcrypt";
import {
  getNotes,
  saveNote,
  getNoteById,
  getUserByEmailAndPassword,
  checkBlocked,
  saveTranscription,
  getNoteByJobId,
} from "../../Shared/framework/repository/mongoRepository";
import jwt from "jsonwebtoken";

import { upload } from "../../Shared/framework/files/multer.config";
import { normalizeFile } from "../../Shared/framework/files/normalizer";
import {
  getSegmentPaths,
  cutBySilence,
} from "../../Shared/framework/files/splitter";
import { randomUUID } from "crypto";

const router = express.Router();

const routes = (server: Express) => {
  server.use("", router);
};

router.get("/check-blocked", async (req: any, res: Response) => {
  const { userId } = req.user;
  const { blocked } = await checkBlocked(userId);
  if (blocked) {
    return res.status(403).json({
      ok: false,
      message: "You have reached the maximum number of requests",
    });
  }
  return res.status(200).json({ ok: true, blocked });
});

router.post("/me", async (req: Request, res: Response) => {
  const { token } = req.cookies;

  const user = jwt.verify(token, process.env.JWT_SECRET as string);

  if (typeof user === "string") {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  if (!user) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const { username, profilePicture } = user;

  return res.status(200).json({
    ok: true,
    user: { username: username, profilePicture: profilePicture },
  });
});

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const { user, error: userNotFound } = await getUserByEmailAndPassword(email);

  if (userNotFound || !user) {
    return res
      .status(404)
      .json({ ok: false, error: userNotFound, tag: "error-user-not-found" });
  }

  const result = await bcrypt.compare(password, user!.password);

  if (!result) {
    return res.status(401).json({
      ok: false,
      error: "Invalid password",
      tag: "error-invalid-password",
    });
  }

  const token = jwt.sign(
    {
      userId: user.userId,
      username: user.username,
      profilePicture: "https://api.dicebear.com/9.x/miniavs/svg?seed=Kimberly",
    },
    process.env.JWT_SECRET as string
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 1000,
  });

  return res.status(200).json({
    ok: true,
    token,
    user: {
      username: user.username,
      profilePicture: "https://api.dicebear.com/9.x/miniavs/svg?seed=Kimberly",
    },
  });
});

router.get("/notes", async (req: Request, res: Response) => {
  const { notes, error: errorGetNotes } = await getNotes();

  if (errorGetNotes || !notes) {
    return res
      .status(500)
      .json({ ok: false, error: errorGetNotes, tag: "error-get-notes" });
  }

  return res.status(200).json({ ok: true, notes });
});

router.get("/notes/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  let typeId: "jobId" | "noteId" = id.includes("-") ? "noteId" : "jobId";

  const { note, error: errorGetNote } =
    typeId === "jobId" ? await getNoteByJobId(id) : await getNoteById(id);

  if (errorGetNote || !note) {
    return res
      .status(500)
      .json({ ok: false, error: errorGetNote, tag: "error-get-note" });
  }

  return res.status(200).json({ ok: true, note });
});

router.post(
  "/upload-file",
  upload.single("file"),
  async (req: any, res: Response) => {
    try {
      const { userId } = req.user;
      const { blocked } = await checkBlocked(userId);

      if (blocked) {
        return res.status(403).json({
          ok: false,
          message: "You have reached the maximum number of requests",
          blocked: true,
        });
      }

      const file = req.file;

      if (!file) {
        return res
          .status(400)
          .json({ ok: false, message: "File is required", blocked: false });
      }

      const normalizedFile = await normalizeFile(file);

      const jobId = randomUUID().split("-")[0];

      const { wavPaths, error, message } = await cutBySilence({
        inputPath: normalizedFile,
        jobId: jobId,
        segmentSeconds: 60,
        filePrefix: "part",
        snapWindowSec: 2.0, // “snap” al silencio +/- 2s
        minGapSec: 5.0, // evita cortes muy seguidos
        paddingSec: 0.25, // bordes más “naturales”
        mp4Precise: false, // true = re-encode exacto
      });

      if (error) {
        console.error(error);
        return res
          .status(500)
          .json({ ok: false, error, tag: "error-cut-by-silence" });
      }

      return res.status(200).json({
        ok: true,
        jobId,
        blocked: false,
        originalPath: normalizedFile,
      });
    } catch (error) {
      return res.status(500).json({ ok: false, error, tag: "error-general" });
    }
  }
);

router.get("/transcribe/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ ok: false, message: "NoteId is required" });
    }

    let typeId: "jobId" | "noteId" = id.includes("-") ? "noteId" : "jobId";

    const { note, error: errorGetNote } =
      typeId === "jobId" ? await getNoteByJobId(id) : await getNoteById(id);

    if (errorGetNote || !note || note.transcription !== "") {
      return res
        .status(500)
        .json({ ok: false, error: errorGetNote, tag: "error-get-note" });
    }

    const { transcription, error: errorTranscribe } = await transcribe([
      note.originalPath,
    ]);

    if (errorTranscribe || !transcription) {
      return res
        .status(500)
        .json({ ok: false, error: errorTranscribe, tag: "error-transcribe" });
    }

    const { error: errorSaveNote } = await saveTranscription(
      transcription,
      note.noteId
    );

    if (errorSaveNote) {
      return res
        .status(500)
        .json({ ok: false, error: errorSaveNote, tag: "error-save-note" });
    }

    return res.status(200).json({ ok: true, transcription });
  } catch (error) {
    return res.status(500).json({ ok: false, error, tag: "error-general" });
  }
});

//event source
router.get("/stream-summarize", async (req: Request, res: Response) => {
  try {
    const { jobId, originalPath } = req.query;

    if (!jobId || typeof jobId !== "string") {
      return res.status(400).json({ ok: false, message: "JobId is required" });
    }

    if (!originalPath || typeof originalPath !== "string") {
      return res
        .status(400)
        .json({ ok: false, message: "OriginalPath is required" });
    }

    const { paths, error: errorGetPaths } = await getSegmentPaths({
      outputDir: jobId as string,
      filePrefix: "part",
    });

    if (errorGetPaths) {
      return res
        .status(500)
        .json({ ok: false, error: errorGetPaths, tag: "error-get-paths" });
    }

    const { transcription, error: errorTranscribe } = await transcribe(
      paths,
      true
    );

    if (errorTranscribe || !transcription) {
      return res
        .status(500)
        .json({ ok: false, error: errorTranscribe, tag: "error-transcribe" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const { summary, error: errorSummarize } = await summarize(
      transcription,
      res
    );

    if (errorSummarize || !summary) {
      console.log({
        ok: false,
        error: errorSummarize,
        tag: "error-summarize",
      });
      return res.end();
    }

    const { note, error: errorSaveNote } = await saveNote(
      summary,
      originalPath,
      jobId
    );

    if (errorSaveNote || !note) {
      console.log({
        ok: false,
        error: errorSaveNote,
        tag: "error-save-note",
      });
      return res.end();
    }

    return res.end();
  } catch (error) {
    console.log({ ok: false, error, tag: "error-general" });
    return res.end();
  }
});

export default routes;
