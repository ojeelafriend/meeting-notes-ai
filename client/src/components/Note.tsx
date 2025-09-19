import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useParams, useSearchParams } from "react-router-dom";
import { getNote, transcribe } from "../services/notes.services";
import { useEffect, useState } from "react";
import { type Note } from "../services/notes.services";
import "../styles/note.css";
import { useLiveStore } from "../stores/liveStore";
import { useNavigate } from "react-router-dom";

// Componente Skeleton minimalista estilo Discord
const NoteSkeleton = () => {
  return (
    <div className="note-skeleton">
      <div className="skeleton-line skeleton-title"></div>
      <div className="skeleton-line skeleton-paragraph"></div>
      <div className="skeleton-line skeleton-paragraph skeleton-short"></div>
      <div className="skeleton-line skeleton-paragraph"></div>
      <div className="skeleton-line skeleton-paragraph skeleton-medium"></div>
    </div>
  );
};

export default function Note() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const partial = searchParams.get("partial") || null;
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [transcription, setTranscription] = useState<string>("");
  const [showTranscript, setShowTranscript] = useState(false);
  const [loadingTranscript, setLoadingTranscript] = useState(false);

  const { summary, setSummary, eventSourceRef, setEventSourceRef } =
    useLiveStore();

  useEffect(() => {
    let includeDash = id?.includes("-");

    if (!includeDash) {
      getNote(id as string)
        .then(async (response) => {
          if (!response.ok) {
            return;
          }
          if (response.note?.noteId) {
            eventSourceRef ? eventSourceRef.current?.close() : null;
            await navigate(`/notes/${response.note.noteId}`);
          }
        })
        .catch((_: any) => {
          return;
        });
    } else {
      getNote(id as string).then((response) => {
        setNote(response.note);
      });
    }

    if (eventSourceRef?.current) {
      eventSourceRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "summary") {
          setSummary(data.text);
        }
        if (data.type === "done") {
          eventSourceRef?.current?.close();
        }
      };

      eventSourceRef.current.onerror = (event) => {
        console.error(event);
        eventSourceRef?.current?.close();
      };
    }
    return;
  }, [id]);

  const handleTranscript = async () => {
    transcribe(undefined, id as string).then((response) => {
      setTranscription(response.transcription);
      setLoadingTranscript(false);
    });

    return;
  };

  if (!note && !partial) {
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
              {new Date(note ? note.createdAt : new Date()).toLocaleDateString(
                "es-ES",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                }
              )}
            </span>
            <span>Markdown formatted</span>
          </div>
          <div className="note-content">
            {partial && !summary && eventSourceRef?.current ? (
              <NoteSkeleton />
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {note ? note.summary : summary}
              </ReactMarkdown>
            )}
          </div>

          <div className="transcript-section">
            <button
              className="transcript-toggle"
              onClick={async () => {
                const newShowTranscript = !showTranscript;
                setShowTranscript(newShowTranscript);
                if (newShowTranscript) {
                  if (partial && transcription === "") {
                    setLoadingTranscript(true);
                    await handleTranscript();
                  }

                  if (
                    note?.transcription === "" &&
                    !partial &&
                    transcription === ""
                  ) {
                    setLoadingTranscript(true);
                    await handleTranscript();
                  }
                }
              }}
            >
              <span>
                {note || transcription !== ""
                  ? "Transcripción completa"
                  : "Generar transcripción completa"}
              </span>
              <span className={`arrow ${showTranscript ? "open" : ""}`}>▼</span>
            </button>

            {showTranscript && (
              <div className="transcript-content">
                <p>
                  {loadingTranscript
                    ? "Generando transcripción, por favor espere..."
                    : note?.transcription !== "" || transcription !== ""
                    ? note?.transcription
                      ? note.transcription
                      : transcription
                    : "Generando transcripción, por favor espere..."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
