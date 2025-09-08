import NoteModel from "./note";
import { Note } from "../domain/Note";
import { Repository } from "../domain/Repository";

export class MongoRepository implements Repository {
  constructor() {}

  async all(): Promise<{ notes: Note[] | null; error: Error | null }> {
    try {
      const notes = await NoteModel.find()
        .select({ _id: 0, __v: 0 })
        .sort({ createdAt: -1 });
      return { notes, error: null };
    } catch (error) {
      return { notes: null, error: error as Error };
    }
  }

  async byId(
    noteId: string
  ): Promise<{ note: Note | null; error: Error | null }> {
    try {
      const note = await NoteModel.findOne({ noteId }).select({
        _id: 0,
        __v: 0,
      });
      if (!note) {
        return { note: null, error: new Error("Note not found") };
      }
      return { note, error: null };
    } catch (error) {
      return { note: null, error: error as Error };
    }
  }

  async create(note: Note): Promise<void> {
    try {
      await NoteModel.create(note);
    } catch (error) {
      throw new Error(error as string);
    }
  }
}
