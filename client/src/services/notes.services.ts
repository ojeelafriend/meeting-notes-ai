import { customFetch } from "./http/customFetch";

export const summarizeMeeting = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await customFetch("/summarize", {
    method: "POST",
    body: formData,
  });

  return {
    ok: response.ok,
    message: `Summarize meeting ${response.ok ? "successfully" : "failed"}`,
  };
};

export type Note = {
  noteId: string;
  title: string;
  transcription: string;
  summary: string;
  createdAt: string;
  recent?: boolean;
};

export const getNotes = async () => {
  const response = await customFetch("/notes", {
    method: "GET",
  });
  console.log(response);
  if (!response.ok) {
    return { ok: false, notes: [] };
  }
  return {
    ok: true,
    notes: response.notes.map((note: Note, index: number) => ({
      noteId: note.noteId,
      title: note.title,
      transcription: note.transcription,
      summary: note.summary,
      createdAt: note.createdAt,
      recent: index === 0,
    })),
  };
};
