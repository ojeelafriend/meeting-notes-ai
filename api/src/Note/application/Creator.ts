import { Note } from "../domain/Note";
import { Repository } from "../domain/Repository";
import { v4 as uuidv4 } from "uuid";

export class Creator {
  constructor(private readonly repository: Repository) {}

  async execute(
    transcription: string,
    title: string,
    summary: string
  ): Promise<void> {
    // IMPLEMENT: OPENAI SERVICES
    this.repository.create({ noteId: uuidv4(), title, transcription, summary });
  }
}
