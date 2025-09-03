import { useState } from "react";
import "../styles/gridnotes.css";
import { useEffect } from "react";
import { getNotes, type Note } from "../services/notes.services";
import { useNavigate } from "react-router-dom";

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
        <h2>{title}</h2>
        <span>
          {new Date(createdAt).toLocaleDateString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </span>
        <p>{summary}</p>
        <p className="recent">{recent ? "Recent" : ""}</p>
      </div>
    </>
  );
}
