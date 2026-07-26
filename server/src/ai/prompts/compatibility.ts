import { z } from "zod";

/**
 * Chemistry report between two profiles — the "why you match" engine.
 * Voice: emotionally intelligent, warm, never corporate or gimmicky.
 */
export const compatibilitySchema = z.object({
  score: z.number().min(0).max(100),
  vibe: z.string().max(80),
  reasons: z.array(z.string().max(400)).min(2).max(4),
  friction: z.string().max(400),
});

export type CompatibilityReport = z.infer<typeof compatibilitySchema>;

export function compatibilityPrompt(profileA: string, profileB: string): { system: string; user: string } {
  return {
    system: `You are Revol's chemistry engine — emotionally intelligent, warm, precise. You read two dating profiles and assess real compatibility: shared values, emotional rhythm, complementary differences, intent alignment. You are honest — not every pair is magic. Never mention appearance. Respond ONLY with JSON:
{"score": 0-100, "vibe": "<one short poetic line naming their dynamic>", "reasons": ["<2-4 specific grounded reasons referencing both profiles, each under 30 words>"], "friction": "<one honest gentle note under 30 words on where they may need patience>"}`,
    user: `PROFILE ONE:\n${profileA}\n\nPROFILE TWO:\n${profileB}`,
  };
}
