import { useRef, useState, type RefObject } from "react";
import { BiCloudUpload } from "react-icons/bi";
import folderIcon from "../assets/folder.png";
import { useNavigate } from "react-router-dom";
import { transcribe } from "../services/notes.services";
import "../index.css";
import { FaLock } from "react-icons/fa";
import { useLiveStore } from "../stores/liveStore";

function App() {
  const navigate = useNavigate();
  const { setOriginalPath, setEventSourceRef, clearAll } = useLiveStore();

  const MAX_SIZE_MB = 100;

  const fileInputRef: RefObject<HTMLInputElement | null> =
    useRef<HTMLInputElement | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  const [isLoading, setIsLoading] = useState<boolean | "summarizing">(false);

  const [isBlocked, setIsBlocked] = useState(false);

  const handleSummarize = async () => {
    const file = fileInputRef.current?.files?.[0];

    if (!file) {
      return;
    }

    const sizeInMB = file.size / (1024 * 1024);

    if (sizeInMB > MAX_SIZE_MB) {
      alert(
        `El archivo pesa ${sizeInMB.toFixed(
          2
        )} MB. El máximo permitido es ${MAX_SIZE_MB} MB.`
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsLoading(true);
    setIsBlocked(false);
    clearAll();

    const { jobId, originalPath, error } = await transcribe(file);

    if (error) {
      setIsBlocked(true);
      return;
    }

    eventSourceRef.current = new EventSource(
      `${
        import.meta.env.VITE_API_URL
      }/stream-summarize?jobId=${jobId}&originalPath=${originalPath}`,
      {
        withCredentials: true,
      }
    );

    setEventSourceRef(eventSourceRef as RefObject<EventSource> | null);
    setOriginalPath(originalPath);

    setIsLoading(false);

    await navigate(`/notes/${jobId}?partial=true`);
  };

  return (
    <>
      <div className="page">
        <h1 className="text-white">Meeting Notes Preview</h1>
        <div className="glass">
          {isLoading ? (
            <div className="loader-container">
              <div className="spinner"></div>
              <div className="loader-container">
                <h1>Procesando tu reunión...</h1>
                <p>Estamos analizando y resumiendo el contenido</p>
              </div>
            </div>
          ) : (
            <>
              <img src={folderIcon} alt="folder" height={100} width={100} />
              <h1>Upload files </h1>
              <p>Select and upload the files of your choice</p>
              <div className="inner-glass">
                <input
                  type="file"
                  accept=".mp3,.m4a,.wav,.webm,.mp4,.mpeg,.mpga,.ogg,.opus,.mov,.aac,.flac,.wma,.aif,.aiff,.caf,.amr,.mkv,.avi,.3gp,.ts"
                  size={100}
                  hidden
                  ref={fileInputRef}
                  onChange={handleSummarize}
                />
                {isBlocked ? (
                  <FaLock size={20} color="gray" />
                ) : (
                  <BiCloudUpload size={30} color="gray" />
                )}

                <p className="text-explained">
                  {isBlocked
                    ? "Por alguna razón este servicio no está disponible"
                    : "Elija un video o audio que no exceda los 10 minutos de duración"}
                </p>
                <p className="text-format-supported">
                  {isBlocked
                    ? "Habla con el administrador para que desbloquees el servicio"
                    : "MP3, MP4, WAV, OPUS con 100MB de tamaño máximo"}
                </p>
                <button
                  className="browse-file"
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  disabled={isBlocked}
                >
                  Browse File
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
