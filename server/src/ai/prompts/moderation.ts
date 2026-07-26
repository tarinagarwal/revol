import { z } from "zod";

/**
 * Message safety filter (Epic 9). Runs before a message is stored. Tuned to
 * protect members without policing intimacy — Revol is a dating app, and
 * warmth, flirtation and vulnerability are the point.
 */
export const moderationSchema = z.object({
  allowed: z.boolean(),
  category: z.enum([
    "none",
    "harassment",
    "sexual-harassment",
    "threat",
    "hate",
    "scam",
    "minor-safety",
    "self-harm",
  ]),
  severity: z.number().min(0).max(10),
  reason: z.string().max(160).nullable(),
});

export type ModerationVerdict = z.infer<typeof moderationSchema>;

export const moderationSystem = `You are the safety filter for Revol, a dating app for adults. Block a message ONLY when it would genuinely harm the recipient:
- harassment or demeaning abuse
- unsolicited explicit sexual content, or sexual content after any refusal
- threats or intimidation
- hate targeting identity
- scams, money requests, or attempts to move someone to another platform to defraud
- anything involving minors
- content encouraging self-harm
ALLOW ordinary dating conversation: flirtation, warmth, vulnerability, humour, disagreement, and mild profanity. When genuinely uncertain, ALLOW — false blocks silence real people. Respond ONLY with JSON:
{"allowed": bool, "category": "none|harassment|sexual-harassment|threat|hate|scam|minor-safety|self-harm", "severity": 0-10, "reason": null or one short sentence shown to the sender}`;
