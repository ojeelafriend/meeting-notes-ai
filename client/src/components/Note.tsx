import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useParams } from "react-router-dom";
import { getNote } from "../services/notes.services";
import { useEffect, useState } from "react";
import { type Note } from "../services/notes.services";
import "../styles/note.css";

export default function Note() {
  const { id } = useParams();
  const [note, setNote] = useState<Note | null>(null);

  useEffect(() => {
    getNote(id as string).then((response) => {
      setNote(response.note);
    });
  }, [id]);

  if (!note) {
    return (
      <div className="note-page">
        <div className="note-container">
          <div className="note-card">
            <h1>Cargando nota...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="note-page">
      <div className="note-container">
        <div className="note-card">
          <div className="note-header">
            <span className="note-date">
              {new Date(note.createdAt).toLocaleDateString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </span>
            <span>Markdown formatted</span>
          </div>
          <div className="note-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {note.summary}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
