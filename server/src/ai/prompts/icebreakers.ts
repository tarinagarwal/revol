import { z } from "zod";

/** Conversation starters rooted in BOTH profiles — never generic. */
export const icebreakersSchema = z.object({
  icebreakers: z.array(z.string().min(10).max(220)).min(3).max(3),
});

export function icebreakersPrompt(profileA: string, profileB: string): { system: string; user: string } {
  return {
    system: `You write opening messages for Revol, a mystery-first dating app where profiles are veiled and conversation is everything. Given two profiles, craft 3 openers PERSON ONE could send PERSON TWO. Each must hook into something specific from PERSON TWO's profile, carry warmth and curiosity, and invite a real answer — no "hey", no pickup lines, no emojis, no appearance references. Respond ONLY with JSON: {"icebreakers": ["...", "...", "..."]}`,
    user: `PERSON ONE (sender):\n${profileA}\n\nPERSON TWO (recipient):\n${profileB}`,
  };
}
