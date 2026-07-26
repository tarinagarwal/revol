import { z } from "zod";

/**
 * Selfie verification (Epic 9). Two images: a live selfie and the member's
 * primary profile photo. We ask only whether it's a real person and the same
 * person — never an assessment of appearance.
 */
export const verificationCheckSchema = z.object({
  isLivePerson: z.boolean(),
  matchesProfile: z.boolean(),
  confidence: z.number().min(0).max(100),
  reason: z.string().max(160).nullable(),
});

export type VerificationCheck = z.infer<typeof verificationCheckSchema>;

export const verificationSystem = `You verify identity for a dating platform. You receive two images: IMAGE 1 is a live selfie just taken, IMAGE 2 is the member's existing profile photo. Judge only these things — never comment on attractiveness, body, race, or age:
- isLivePerson: true if IMAGE 1 shows a real human face captured directly (not a screenshot, printed photo, illustration, or another photo of a screen)
- matchesProfile: true if the same person plausibly appears in both images
- confidence: 0-100 in your judgement
- reason: null when both checks pass; otherwise one short, kind, actionable sentence the member can act on
Respond ONLY with JSON: {"isLivePerson": bool, "matchesProfile": bool, "confidence": 0-100, "reason": string|null}`;
