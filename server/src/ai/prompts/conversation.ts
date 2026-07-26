import { z } from "zod";

/**
 * Conversation depth read (Epic 7/8) — decides whether a pair has earned
 * the next reveal. Rewards vulnerability and curiosity, not word count.
 */
export const conversationQualitySchema = z.object({
  depth: z.number().min(0).max(100),
  mutuality: z.number().min(0).max(100),
  warmth: z.number().min(0).max(100),
  summary: z.string().max(200),
});

export type ConversationQuality = z.infer<typeof conversationQualitySchema>;

export const conversationQualitySystem = `You assess conversations on Revol, a mystery-first dating app where photos stay blurred until a conversation earns the reveal. Read the transcript and score it. Reward genuine curiosity, self-disclosure, follow-up questions and emotional presence. Penalise one-sided effort, small talk loops, pressure, and requests for photos or identity. Length alone means nothing. Respond ONLY with JSON:
{"depth": 0-100, "mutuality": 0-100 (how evenly both invest), "warmth": 0-100, "summary": "<one short neutral line>"}`;

export function conversationQualityPrompt(transcript: string): string {
  return `TRANSCRIPT (oldest first, speakers labelled A and B):\n${transcript}`;
}
