import { api, apiForm } from "@/lib/api";

/** Types mirror GET /onboarding/config + /state responses. */
export type OnboardingConfig = {
  personalityQuestions: { id: string; text: string; low: string; high: string }[];
  values: string[];
  interests: string[];
  prompts: { id: string; question: string }[];
  genders: string[];
  interestedIn: string[];
  intents: { id: string; label: string; description: string }[];
  education: { id: string; label: string }[];
  habits: { id: string; label: string }[];
  kids: { id: string; label: string }[];
  languages: string[];
  rules: {
    minAge: number;
    values: { min: number; max: number };
    interests: { min: number; max: number };
    prompts: { min: number; max: number; maxAnswerLength: number };
    photos: { min: number; max: number };
    languages: { max: number };
  };
};

export type LifestyleInput = {
  heightCm: number | null;
  work: string;
  education: string;
  drinking: string;
  smoking: string;
  kids: string;
  languages: string[];
};

export type OnboardingState = {
  step: number;
  completed: boolean;
  sections: {
    basics: { birthdate: string; gender: string; interestedIn: string[]; city: string } | null;
    lifestyle: Partial<LifestyleInput> | null;
    photoCount: number;
    intent: string | null;
    personality: Record<string, number> | null;
    values: string[] | null;
    interests: string[] | null;
    prompts: { promptId: string; question: string; answer: string }[] | null;
    voiceIntro: { durationSec: number; url: string | null } | null;
  };
};

export const getOnboardingConfig = () => api<OnboardingConfig>("/onboarding/config");
export const getOnboardingState = () => api<OnboardingState>("/onboarding/state");

const put = (section: string, body: unknown) =>
  api<{ ok: boolean; step: number }>(`/onboarding/${section}`, { method: "PUT", body: JSON.stringify(body) });

export const saveBasics = (b: { birthdate: string; gender: string; interestedIn: string[]; city: string }) =>
  put("basics", b);
export const saveIntent = (intent: string) => put("intent", { intent });
export const saveLifestyle = (l: LifestyleInput) => put("lifestyle", l);
export const finishPhotos = () => api<{ ok: boolean; step: number }>("/onboarding/photos-done", { method: "POST" });
export const savePersonality = (answers: Record<string, number>) => put("personality", { answers });
export const saveValues = (values: string[]) => put("values", { values });
export const saveInterests = (interests: string[]) => put("interests", { interests });
export const savePrompts = (prompts: { promptId: string; answer: string }[]) => put("prompts", { prompts });

export const uploadVoiceIntro = (blob: Blob, durationSec: number) => {
  const ext = blob.type.includes("wav") ? "wav" : blob.type.includes("mp4") ? "m4a" : "webm";
  const form = new FormData();
  form.append("durationSec", String(durationSec));
  form.append("file", blob, `voice-intro.${ext}`);
  return apiForm<{ ok: boolean; url: string | null }>("/onboarding/voice", form);
};

export const skipVoiceIntro = () => api<{ ok: boolean }>("/onboarding/voice", { method: "DELETE" });
export const completeOnboarding = () => api<{ ok: boolean; completed: boolean }>("/onboarding/complete", { method: "POST" });
