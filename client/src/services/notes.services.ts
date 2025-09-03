import { customFetch } from "./http/customFetch";

export const summarizeMeeting = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await customFetch("/summarize", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    return {
      ok: false,
      message: response.message,
    };
  }
  return {
    ok: response.ok,
    message: `Summarize meeting successfully`,
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

export const getNote = async (id: string) => {
  const response = await customFetch(`/notes/${id}`, {
    method: "GET",
  });
  if (!response.ok) {
    return { ok: false, note: null };
  }
  return {
    ok: response.ok,
    note: response.note as Note,
  };
};
