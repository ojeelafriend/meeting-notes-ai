import { BiCloudUpload } from "react-icons/bi";
import folderIcon from "./assets/folder.png";

function App() {
  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h2 className="header-title">Neural Tools</h2>
          <div className="header-buttons">
            <button className="btn-primary">Summarize</button>
            <button className="btn-secondary">List summaries</button>
          </div>
        </div>
      </header>

      <div className="page">
        <h1 className="text-white">Meeting Notes AI</h1>
        <div className="glass">
          <img src={folderIcon} alt="folder" height={100} width={100} />
          <h1>Upload files </h1>
          <p>Select and upload the files of your choice</p>
          <div className="inner-glass">
            <input type="file" multiple hidden />

            <BiCloudUpload size={30} color="gray" />
            <p className="text-explained">
              Choose a file or drag and drop it here
            </p>
            <p className="text-format-supported">
              MP4, MP3 formats supported, up to 100MB
            </p>
            <button className="browse-file">Browse File</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
