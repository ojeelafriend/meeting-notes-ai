import { customFetch } from "./http/customFetch";

export const transcribe = async (file?: File, originalPath?: string) => {
  try {
    if (!file) {
      const result = await customFetch(`/transcribe/${originalPath}`, {
        method: "GET",
      });

      if (!result.ok) {
        return { transcription: "", error: result.error };
      }

      return { transcription: result.transcription, error: null };
    }

    const formData = new FormData();

    formData.append("file", file);

    const result = await customFetch("/upload-file", {
      method: "POST",
      body: formData,
    });

    if (!result.ok || result.blocked) {
      return { jobId: null, originalPath: null, error: result.message };
    }

    return {
      jobId: result.jobId,
      originalPath: result.originalPath,
      error: null,
    };
  } catch (error) {
    return {
      jobId: null,
      originalPath: null,
      error: error,
    };
  }
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
