import { api } from "@/lib/api";

export type Preferences = {
  ageMin: number;
  ageMax: number;
  cityPreference: "same" | "anywhere";
  intents: string[];
  paused: boolean;
};

export const getPreferences = () => api<{ preferences: Preferences }>("/preferences");

export const updatePreferences = (patch: Partial<Preferences>) =>
  api<{ preferences: Preferences }>("/preferences", { method: "PUT", body: JSON.stringify(patch) });
