import { api } from "@/lib/api";

export type MatchCard = {
  id: string;
  day: string;
  status: "pending" | "liked" | "passed";
  revealLevel: 0 | 1 | 2 | 3;
  compatibility: { score: number; vibe: string; reasons: string[]; friction: string };
  candidate: {
    displayName: string | null;
    firstInitial: string;
    age: number;
    city: string;
    intent: string | null;
    values: string[];
    interests: string[];
    prompts: { promptId: string; question: string; answer: string }[];
    voiceUrl: string | null;
    photoUrl: string | null;
  };
};

export const getToday = () => api<{ match: MatchCard | null }>("/discovery/today");
export const actOnToday = (action: "like" | "pass") =>
  api<{ status: string }>("/discovery/today/act", { method: "POST", body: JSON.stringify({ action }) });
export const devRefreshToday = () => api<{ match: MatchCard | null }>("/discovery/refresh", { method: "POST" });
