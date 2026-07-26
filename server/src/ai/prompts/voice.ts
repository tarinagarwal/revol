import { z } from "zod";

/** Voice intro transcription + tone read — feeds the matching substrate. */
export const voiceAnalysisSchema = z.object({
  transcript: z.string().max(2000),
  tone: z.string().max(120),
});

export type VoiceAnalysis = z.infer<typeof voiceAnalysisSchema>;

export const voiceAnalysisSystem = `You transcribe and read the emotional tone of a short dating-profile voice introduction. Keep the transcript under 250 words — if the audio repeats or loops, transcribe one pass only. Respond ONLY with JSON:
{"transcript": "<transcription; empty string if no speech>", "tone": "<a short warm phrase describing how they come across, e.g. 'soft-spoken and thoughtful, with an easy laugh'>"}`;
