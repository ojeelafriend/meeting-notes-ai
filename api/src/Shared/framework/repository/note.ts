import mongoose from "mongoose";

const NoteModel = mongoose.model(
  "Note",
  new mongoose.Schema(
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
