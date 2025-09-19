// src/auth/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../stores/authStore";

export default function ProtectedRoute() {
  const isAuthed = useAuth((s) => s.isAuthenticated());
  return isAuthed ? <Outlet /> : <Navigate to="/login" replace />;
}
