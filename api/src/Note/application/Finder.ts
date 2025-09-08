import { Note } from "../domain/Note";
import { Repository } from "../domain/Repository";

//**Finder: Find all notes or a single note by id, default return all notes */

export class Finder {
  constructor(private readonly repository: Repository) {}

  async execute(noteId?: string): Promise<{
    notes?: Note[] | null;
    note?: Note | null;
    error: Error | null;
  }> {
    if (!noteId) {
      return await this.repository.all();
    }

    return await this.repository.byId(noteId);
  }
}
