import { Routes } from "react-router-dom";
import { Route } from "react-router-dom";
import { useNavigate, Outlet } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

import Home from "./components/Home";
import GridNotes from "./components/GridNotes";
import Note from "./components/Note";
import "./index.css";
import Login from "./components/Login";
import ProtectedRoute from "./auth/ProtectedRoute";
import { useAuth } from "./stores/authStore";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Header />}>
            <Route path="/" element={<Home />} />
            <Route path="/notes" element={<GridNotes />} />
            <Route path="/notes/:id" element={<Note />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const toggleTooltip = () => {
    setShowTooltip(!showTooltip);
  };

  // Cerrar tooltip al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        setShowTooltip(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <header className="header">
        <div className="header-content">
          <div className="user-profile" ref={tooltipRef}>
            <img
              src={user?.profilePicture}
              alt={user?.username}
              className="profile-picture"
            />
            <span className="username" onClick={toggleTooltip}>
              @{user?.username}
            </span>
            {showTooltip && (
              <div className="tooltip">
                <div className="tooltip-content">
                  <p>¿Cerrar sesión?</p>
                  <div className="tooltip-buttons">
                    <button className="btn-confirm" onClick={handleLogout}>
                      Sí, salir
                    </button>
                    <button
                      className="btn-cancel"
                      onClick={() => setShowTooltip(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="header-buttons">
            <button className="btn-primary" onClick={() => navigate("/")}>
              Summarize
            </button>
            <button
              className="btn-secondary"
              onClick={() => navigate("/notes")}
            >
              <span className="btn-text-desktop">List summaries</span>
              <span className="btn-text-mobile">Notes</span>
            </button>
          </div>
        </div>
      </header>
      <Outlet />
    </>
  );
};
