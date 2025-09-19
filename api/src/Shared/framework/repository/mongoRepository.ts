import { extractTitle } from "../../utils";
import NoteModel from "./note";
import UserModel from "./user";
import { v4 as uuidv4 } from "uuid";

export const saveNote = async (
  summary: string,
  originalPath: string,
  jobId: string
) => {
  try {
    const title = extractTitle(summary);

    const note = new NoteModel({
      noteId: uuidv4(),
      summary: summary.replace(/\s*undefined$/, ""),
      title,
      originalPath,
      jobId,
    });

    await note.save();

    return { note, error: null };
  } catch (error) {
    return { note: null, error: error };
  }
};

export const getNotes = async () => {
  try {
    const notes = await NoteModel.find()
      .select("-_id -__v")
      .sort({ createdAt: -1 });
    return { notes, error: null };
  } catch (error) {
    return { notes: null, error: error };
  }
};

export const saveTranscription = async (
  transcription: string,
  noteId: string
) => {
  try {
    const note = await NoteModel.findOneAndUpdate(
      { noteId },
      { transcription }
    );
    return { note, error: null };
  } catch (error) {
    return { note: null, error: error };
  }
};

export const getNoteById = async (noteId: string) => {
  try {
    const note = await NoteModel.findOne({ noteId });
    return { note, error: null };
  } catch (error) {
    return { note: null, error: error };
  }
};

export const getNoteByJobId = async (jobId: string) => {
  try {
    const note = await NoteModel.findOne({ jobId });
    return { note, error: null };
  } catch (error) {
    return { note: null, error: error };
  }
};

export const getUserByEmailAndPassword = async (email: string) => {
  try {
    const user = await UserModel.findOne({ email });
    return { user, error: null };
  } catch (error) {
    return { user: null, error: error };
  }
};

export const checkBlocked = async (userId: string) => {
  try {
    const countNotes = await NoteModel.find().countDocuments();
    return { blocked: countNotes >= 10, error: null };
  } catch (error) {
    return { blocked: true, error: error };
  }
};
