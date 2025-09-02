import { extractTitle } from "../../utils";
import NoteModel from "./note";
import { v4 as uuidv4 } from "uuid";

export const saveNote = async (
  transcription: string,
  summary: string,
  title: string = extractTitle(summary)
) => {
  try {
    console.log("title", title);

    const note = new NoteModel({
      noteId: uuidv4(),
      transcription,
      summary,
      title,
    });

    await note.save();

    return { note, error: null };
  } catch (error) {
    return { note: null, error: error };
  }
};

export const getNotes = async () => {
  try {
    const notes = await NoteModel.find().select("-_id -__v");
    return { notes, error: null };
  } catch (error) {
    return { notes: null, error: error };
  }
};
