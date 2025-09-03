// src/stores/auth.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { customFetch } from "../services/http/customFetch";

type User = { username: string; profilePicture: string } | null;

type AuthState = {
  user: User;
  setUser: (u: User) => void;
  logout: () => Promise<void>;
  isAuthenticated: () => boolean;
};

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (u) => set({ user: u }),
      isAuthenticated: () => !!get().user,
      logout: async () => {
        try {
          await customFetch("/logout", { method: "POST" });
        } finally {
          set({ user: null });
        }
      },
    }),
    {
      name: "auth-storage", // nombre de la clave en localStorage
      partialize: (state) => ({ user: state.user }), // solo persiste el user
    }
  )
);
