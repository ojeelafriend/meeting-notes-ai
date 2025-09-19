import { useState } from "react";
import "../styles/gridnotes.css";
import { useEffect } from "react";
import { getNotes, type Note } from "../services/notes.services";
import { useNavigate } from "react-router-dom";

// Función para limpiar el texto markdown y remover símbolos
const cleanMarkdownText = (text: string): string => {
  return (
    text
      // Remover headers (# ## ### etc.)
      .replace(/^#{1,6}\s+/gm, "")
      // Remover bold (**text** o __text__)
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      // Remover italic (*text* o _text_)
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/_(.*?)_/g, "$1")
      // Remover links [text](url)
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Remover código inline `code`
      .replace(/`([^`]+)`/g, "$1")
      // Remover bloques de código
      .replace(/```[\s\S]*?```/g, "")
      // Limpiar espacios múltiples y saltos de línea
      .replace(/\n\s*\n/g, "\n")
      .replace(/\s+/g, " ")
      .trim()
  );
};

export default function GridNotes() {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    getNotes().then((response) => {
      setNotes(response.notes);
    });
  }, []);

  return (
    <div className="grid-notes-container">
      <div className="grid-notes-header">
        <h1>Notes</h1>
      </div>
      <div className="grid-notes-items ">
        {notes.map((note) => (
          <Item
            title={note.title}
            key={note.noteId}
            noteId={note.noteId}
            transcription={note.transcription}
            summary={note.summary}
            createdAt={note.createdAt}
            recent={note.recent}
          />
        ))}
      </div>
    </div>
  );
}

function Item({ title, noteId, summary, createdAt, recent }: Note) {
  const navigate = useNavigate();
  return (
    <>
      <div className="grid-item" onClick={() => navigate(`/notes/${noteId}`)}>
        <h2>{cleanMarkdownText(title)}</h2>
        <span>
          {new Date(createdAt).toLocaleDateString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </span>
        {cleanMarkdownText(summary).slice(0, 600)}
        <p className="recent">{recent ? "Recent" : ""}</p>
      </div>
    </>
  );
}
