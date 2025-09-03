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
} from "../../Shared/framework/repository/mongoRepository";
import jwt from "jsonwebtoken";

const router = express.Router();

const routes = (server: Express) => {
  server.use("", router);
};

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

router.get("/notes/:noteId", async (req: Request, res: Response) => {
  const { noteId } = req.params;
  const { note, error: errorGetNote } = await getNoteById(noteId);
  if (errorGetNote || !note) {
    return res
      .status(500)
      .json({ ok: false, error: errorGetNote, tag: "error-get-note" });
  }

  return res.status(200).json({ ok: true, note });
});

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({ storage });

router.post(
  "/summarize",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({ ok: false, error: "File is required" });
      }

      const { transcription, error: errorTranscribe } = await transcribe(file);

      if (errorTranscribe || !transcription) {
        return res
          .status(400)
          .json({ ok: false, error: errorTranscribe, tag: "error-transcribe" });
      }

      const { summary, error: errorSummarize } = await summarize(transcription);

      if (errorSummarize || !summary) {
        return res
          .status(500)
          .json({ ok: false, error: errorSummarize, tag: "error-summarize" });
      }

      const { note, error: errorSaveNote } = await saveNote(
        transcription,
        summary
      );

      if (errorSaveNote || !note) {
        return res
          .status(500)
          .json({ ok: false, error: errorSaveNote, tag: "error-save-note" });
      }

      return res.status(200).json({ ok: true, note });
    } catch (error) {
      return res.status(500).json({ ok: false, error, tag: "error-general" });
    }
  }
);

export default routes;
