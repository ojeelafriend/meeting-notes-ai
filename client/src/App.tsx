import { Routes } from "react-router-dom";
import { Route } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import Home from "./components/Home";
import GridNotes from "./components/GridNotes";
import "./index.css";

export default function App() {
  const navigate = useNavigate();
  return (
    <>
      <header className="header">
        <div className="header-content">
          <h2 className="header-title">Neural Tools AI</h2>
          <div className="header-buttons">
            <button className="btn-primary" onClick={() => navigate("/")}>
              Summarize
            </button>
            <button
              className="btn-secondary"
              onClick={() => navigate("/notes")}
            >
              List summaries
            </button>
          </div>
        </div>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/notes" element={<GridNotes />} />
      </Routes>
    </>
  );
}
