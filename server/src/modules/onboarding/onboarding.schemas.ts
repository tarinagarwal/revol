import { z } from "zod";
import { GENDERS, INTERESTED_IN, INTENTS, PERSONALITY_QUESTIONS, PROMPTS, VALUES, INTERESTS } from "./onboarding.data.js";

const questionIds = PERSONALITY_QUESTIONS.map((q) => q.id) as [string, ...string[]];
const promptIds = PROMPTS.map((p) => p.id) as [string, ...string[]];
const intentIds = INTENTS.map((i) => i.id) as [string, ...string[]];

export const basicsSchema = z.object({
  birthdate: z.coerce.date().refine((d) => {
    const age = (Date.now() - d.getTime()) / (365.25 * 86_400_000);
    return age >= 18 && age <= 100;
  }, "You must be at least 18"),
  gender: z.enum(GENDERS),
  interestedIn: z.array(z.enum(INTERESTED_IN)).min(1).max(4),
  city: z.string().trim().min(2).max(80),
});

export const intentSchema = z.object({ intent: z.enum(intentIds) });

export const personalitySchema = z.object({
  answers: z.record(z.enum(questionIds), z.number().int().min(1).max(5)).refine(
    (a) => PERSONALITY_QUESTIONS.every((q) => a[q.id] !== undefined),
    "Answer every question",
  ),
});

export const valuesSchema = z.object({
  values: z.array(z.enum(VALUES as unknown as [string, ...string[]])).min(3).max(5),
});

export const interestsSchema = z.object({
  interests: z.array(z.enum(INTERESTS as unknown as [string, ...string[]])).min(3).max(8),
});

export const lifestyleSchema = z.object({
  heightCm: z.number().int().min(120).max(230).nullable().optional(),
  work: z.string().trim().max(80).optional(),
  education: z.enum(["high-school", "in-college", "undergraduate", "postgraduate", "doctorate", "self-taught", ""]).optional(),
  drinking: z.enum(["never", "socially", "regularly", ""]).optional(),
  smoking: z.enum(["never", "socially", "regularly", ""]).optional(),
  kids: z.enum(["want-someday", "dont-want", "have-and-want-more", "have-and-done", "unsure", ""]).optional(),
  languages: z.array(z.string().max(30)).max(5).optional(),
});

export const promptsSchema = z.object({
  prompts: z
    .array(
      z.object({
        promptId: z.enum(promptIds),
        answer: z.string().trim().min(3).max(240),
      }),
    )
    .min(2)
    .max(3)
    .refine((arr) => new Set(arr.map((p) => p.promptId)).size === arr.length, "Duplicate prompts"),
});
