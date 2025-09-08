import mongoose from "mongoose";
import { Note } from "../domain/Note";

type NoteDocument = Note & mongoose.Document;

const NoteModel = mongoose.model(
  "Note",
  new mongoose.Schema<NoteDocument>(
    {
      noteId: { type: String, required: true, unique: true },
      title: { type: String, required: true },
      transcription: { type: String, required: true },
      summary: { type: String, required: true },
    },
    {
      timestamps: true,
    }
  )
);

export default NoteModel;
