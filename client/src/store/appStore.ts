import { create } from "zustand";

/**
 * Global UI state (Zustand). Server state lives in TanStack Query, never here.
 * Auth store lands in Epic 2.
 */
type AppState = {
  booted: boolean;
  setBooted: (booted: boolean) => void;
};

export const useAppStore = create<AppState>((set) => ({
  booted: false,
  setBooted: (booted) => set({ booted }),
}));
