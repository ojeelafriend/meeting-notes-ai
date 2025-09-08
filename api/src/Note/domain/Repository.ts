import { Note } from "./Note";

export interface Repository {
  create(note: Note): Promise<void>;
  all(): Promise<{ notes: Note[] | null; error: Error | null }>;
  byId(noteId: string): Promise<{ note: Note | null; error: Error | null }>;
}
