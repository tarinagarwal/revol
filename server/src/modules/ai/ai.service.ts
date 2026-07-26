import { AIService } from "../../ai/AIService.js";
import { env } from "../../config/env.js";
import { Profile } from "../../db/models/Profile.js";
import { buildProfileText } from "../onboarding/profile-text.js";
import { compatibilityPrompt, compatibilitySchema, type CompatibilityReport } from "../../ai/prompts/compatibility.js";
import { icebreakersPrompt, icebreakersSchema } from "../../ai/prompts/icebreakers.js";
import { photoAnalysisSchema, photoAnalysisSystem, type PhotoAnalysis } from "../../ai/prompts/vision.js";
import { voiceAnalysisSchema, voiceAnalysisSystem, type VoiceAnalysis } from "../../ai/prompts/voice.js";

/** Epic 5 capabilities — every AI feature the product uses, in one place. */

async function profileTextFor(userId: string): Promise<string> {
  const p = await Profile.findOne({ userId });
  if (!p?.onboarding?.completed) throw new Error("Profile not complete");
  return buildProfileText(p);
}

export async function compatibilityReport(userIdA: string, userIdB: string): Promise<CompatibilityReport> {
  const [a, b] = await Promise.all([profileTextFor(userIdA), profileTextFor(userIdB)]);
  const { system, user } = compatibilityPrompt(a, b);
  return AIService.chatJSON(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    compatibilitySchema,
  );
}

export async function icebreakers(senderUserId: string, recipientUserId: string): Promise<string[]> {
  const [a, b] = await Promise.all([profileTextFor(senderUserId), profileTextFor(recipientUserId)]);
  const { system, user } = icebreakersPrompt(a, b);
  const result = await AIService.chatJSON(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    icebreakersSchema,
    { temperature: 0.85 },
  );
  return result.icebreakers;
}

export async function analyzePhoto(imageBuffer: Buffer, mimeType: string): Promise<PhotoAnalysis> {
  const dataUrl = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;
  return AIService.chatJSON(
    [
      { role: "system", content: photoAnalysisSystem },
      {
        role: "user",
        content: [
          { type: "text", text: "Review this profile photo." },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
    photoAnalysisSchema,
    { model: env.AI_VISION_MODEL, temperature: 0.1 },
  );
}

export async function analyzeVoice(audioBuffer: Buffer, mimeType: string): Promise<VoiceAnalysis> {
  const format = mimeType.includes("wav") ? "wav" : mimeType.includes("mp3") ? "mp3" : "webm";
  return AIService.chatJSON(
    [
      { role: "system", content: voiceAnalysisSystem },
      {
        role: "user",
        content: [
          { type: "text", text: "Transcribe and read the tone of this voice introduction." },
          { type: "input_audio", input_audio: { data: audioBuffer.toString("base64"), format } },
        ],
      },
    ],
    voiceAnalysisSchema,
    { model: env.AI_AUDIO_MODEL, temperature: 0.1, maxTokens: 3000 },
  );
}
