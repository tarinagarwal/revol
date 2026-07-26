import { api } from "@/lib/api";

export type MatchPerson = {
  displayName: string | null;
  firstInitial: string;
  verified: boolean;
  age: number | null;
  city: string | null;
  userId?: string;
  intent: string | null;
  values: string[];
  interests: string[];
  prompts: { promptId: string; question: string; answer: string }[];
  voiceUrl: string | null;
  photoUrl: string | null;
};

export type MutualMatch = {
  id: string;
  revealLevel: 0 | 1 | 2 | 3;
  compatibility: { score: number; vibe: string; reasons: string[]; friction: string };
  matchedAt: string;
  messageCount: number;
  person: MatchPerson;
};

export const getMatches = () => api<{ matches: MutualMatch[] }>("/matches");
export const getMatchDetail = (id: string) => api<{ match: MutualMatch }>(`/matches/${id}`);
