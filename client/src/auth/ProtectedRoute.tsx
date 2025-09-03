// src/auth/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../stores/authStore";

export default function ProtectedRoute() {
  console.log(useAuth((s) => s.isAuthenticated()));
  const isAuthed = useAuth((s) => s.isAuthenticated());
  return isAuthed ? <Outlet /> : <Navigate to="/login" replace />;
}
