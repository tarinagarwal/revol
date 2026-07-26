import { z } from "zod";

/** Photo understanding + authenticity signal — runs on every photo upload. */
export const photoAnalysisSchema = z.object({
  isHuman: z.boolean(),
  safe: z.boolean(),
  quality: z.number().min(0).max(10),
  description: z.string().max(200),
  flaggedReason: z.string().max(120).nullable(),
});

export type PhotoAnalysis = z.infer<typeof photoAnalysisSchema>;

export const photoAnalysisSystem = `You review profile photos for Revol, a dating platform. Assess the image and respond ONLY with JSON:
{"isHuman": <true if a real human person is the clear subject>, "safe": <false for nudity, violence, minors, weapons, or graphic content>, "quality": <0-10 photographic quality>, "description": "<neutral one-line description>", "flaggedReason": <null, or a short reason when isHuman is false or safe is false>}`;
