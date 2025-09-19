import { create } from "zustand";
import { type RefObject } from "react";

type LiveStore = {
  summary: string;
  setSummary: (summary: string) => void;
  clearAll: () => void;
  originalPath: string;
  setOriginalPath: (originalPath: string) => void;
  eventSourceRef: RefObject<EventSource> | null;
  setEventSourceRef: (eventSourceRef: RefObject<EventSource> | null) => void;
};

export const useLiveStore = create<LiveStore>((set) => ({
  summary: "",
  setSummary: (summary) => set({ summary }),
  clearAll: () => set({ summary: "", originalPath: "", eventSourceRef: null }),
  originalPath: "",
  setOriginalPath: (originalPath) => set({ originalPath }),
  eventSourceRef: null,
  setEventSourceRef: (eventSourceRef) => set({ eventSourceRef }),
}));
