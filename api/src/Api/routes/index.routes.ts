import express, { Request, Response, Express } from "express";
import multer from "multer";
import path from "path";
import {
  summarize,
  transcribe,
} from "../../Shared/framework/openai/transcripter";
import { extractTitle } from "../../Shared/utils";
import {
  getNotes,
  saveNote,
} from "../../Shared/framework/repository/mongoRepository";

const router = express.Router();

const routes = (server: Express) => {
  server.use("", router);
};

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname); // ej: ".mp4"
    cb(null, Date.now() + ext);
  },
});

const upload = multer({ storage });

router.get("/notes", async (req: Request, res: Response) => {
  const { notes, error: errorGetNotes } = await getNotes();

  if (errorGetNotes || !notes) {
    return res
      .status(500)
      .json({ ok: false, error: errorGetNotes, tag: "error-get-notes" });
  }

  return res.status(200).json({ ok: true, notes });
});

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
