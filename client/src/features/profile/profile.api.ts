import { api } from "@/lib/api";

export type MyProfile = {
  displayName: string;
  email: string;
  age: number | null;
  city: string | null;
  gender: string | null;
  interestedIn: string[];
  intent: string | null;
  personality: Record<string, number> | null;
  values: string[];
  interests: string[];
  prompts: { promptId: string; question: string; answer: string }[];
  voiceIntro: { durationSec: number; transcript: string | null; url: string | null } | null;
  photos: { id: string; position: number; url: string | null }[];
  onboardingCompleted: boolean;
};

export const getMyProfile = () => api<{ profile: MyProfile }>("/profile/me");
