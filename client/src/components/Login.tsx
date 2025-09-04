import { useState } from "react";
import { useAuth } from "../stores/authStore";
import { useNavigate } from "react-router-dom";
import { customFetch } from "../services/http/customFetch";
import "../styles/login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await customFetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: { email, password },
      });

      if (response.ok) {
        setUser({
          username: response.user.username,
          profilePicture: response.user.profilePicture,
        });

        navigate("/");
      } else {
        const errorData = await response.json();
        if (errorData.tag === "error-user-not-found") {
          setError("Email no encontrado");
        } else if (errorData.tag === "error-invalid-password") {
          setError("Contraseña incorrecta");
        } else {
          setError("Error al iniciar sesión");
        }
      }
    } catch (err) {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="professional-header">
        <div className="brand">Smart Notes</div>
        <div className="tagline">
          Plataforma para resumir tus reuniones con IA
        </div>
      </div>

      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>Iniciar Sesión</h1>
            <p>Accede a tus notas de reuniones</p>
          </div>

          {error && (
            <div className="error-message">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                placeholder="tu@email.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                placeholder="••••••••"
              />
            </div>

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? (
                <div className="login-loader">
                  <div className="spinner-small"></div>
                  <span>Iniciando sesión...</span>
                </div>
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="professional-footer">
        <div className="footer-text">
          Desarrollado como demostración técnica
        </div>

        <a
          href="https://www.linkedin.com/in/alejo-solis/"
          target="_blank"
          rel="noopener noreferrer"
          className="linkedin-link"
        >
          Alejo Ruben Solis | Software Engineer
        </a>
      </div>
    </div>
  );
}
