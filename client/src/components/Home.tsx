import { useRef, useState, type RefObject } from "react";
import { BiCloudUpload } from "react-icons/bi";
import folderIcon from "../assets/folder.png";
import { useNavigate } from "react-router-dom";
import { summarizeMeeting } from "../services/notes.services";
import "../index.css";
import { FaLock } from "react-icons/fa";

function App() {
  const navigate = useNavigate();
  const MAX_SIZE_MB = 100;

  const fileInputRef: RefObject<HTMLInputElement | null> =
    useRef<HTMLInputElement | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const [isBlocked, setIsBlocked] = useState(false);

  const handleSummarize = async () => {
    const file = fileInputRef.current?.files?.[0];

    if (!file) {
      console.log("No file selected");
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
    const { ok } = await summarizeMeeting(file);
    setIsLoading(false);

    if (ok) {
      navigate("/notes/");
    } else {
      setIsBlocked(true);
    }
  };

  return (
    <>
      <div className="page">
        <h1 className="text-white">Meeting Notes Preview</h1>
        <div className="glass">
          {isLoading ? (
            <div className="loader-container">
              <div className="spinner"></div>
              <h1>Procesando tu reunión...</h1>
              <p>Estamos analizando y resumiendo el contenido</p>
            </div>
          ) : (
            <>
              <img src={folderIcon} alt="folder" height={100} width={100} />
              <h1>Upload files </h1>
              <p>Select and upload the files of your choice</p>
              <div className="inner-glass">
                <input
                  type="file"
                  accept=".mp4, .mp3"
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
                    ? "Has alcanzado el límite de solicitudes"
                    : "Choose a file or drag and drop it here"}
                </p>
                <p className="text-format-supported">
                  {isBlocked
                    ? "Habla con el administrador para que desbloquees el servicio"
                    : "MP4, MP3 formats supported, up to 100MB"}
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
