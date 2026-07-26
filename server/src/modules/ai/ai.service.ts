import { AIService } from "../../ai/AIService.js";
import { env } from "../../config/env.js";
import { Profile } from "../../db/models/Profile.js";
import { buildProfileText } from "../onboarding/profile-text.js";
import { compatibilityPrompt, compatibilitySchema, type CompatibilityReport } from "../../ai/prompts/compatibility.js";
import { icebreakersPrompt, icebreakersSchema } from "../../ai/prompts/icebreakers.js";
import { photoAnalysisSchema, photoAnalysisSystem, type PhotoAnalysis } from "../../ai/prompts/vision.js";
import { voiceAnalysisSchema, voiceAnalysisSystem, type VoiceAnalysis } from "../../ai/prompts/voice.js";
import { verificationCheckSchema, verificationSystem, type VerificationCheck } from "../../ai/prompts/verification.js";
import { moderationSchema, moderationSystem, type ModerationVerdict } from "../../ai/prompts/moderation.js";

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

/** Epic 9 — selfie vs profile photo. Never judges appearance, only identity. */
export async function verifySelfie(
  selfie: { buffer: Buffer; mimeType: string },
  profilePhoto: { buffer: Buffer; mimeType: string },
): Promise<VerificationCheck> {
  const toUrl = (b: Buffer, m: string) => `data:${m};base64,${b.toString("base64")}`;
  return AIService.chatJSON(
    [
      { role: "system", content: verificationSystem },
      {
        role: "user",
        content: [
          { type: "text", text: "IMAGE 1 — live selfie:" },
          { type: "image_url", image_url: { url: toUrl(selfie.buffer, selfie.mimeType) } },
          { type: "text", text: "IMAGE 2 — existing profile photo:" },
          { type: "image_url", image_url: { url: toUrl(profilePhoto.buffer, profilePhoto.mimeType) } },
        ],
      },
    ],
    verificationCheckSchema,
    { model: env.AI_VISION_MODEL, temperature: 0.1 },
  );
}

/**
 * Epic 9 — message safety filter. Fails OPEN: if the model is unreachable we
 * must not silence real conversations, and reports still catch abuse.
 */
export async function moderateMessage(text: string): Promise<ModerationVerdict> {
  try {
    return await AIService.chatJSON(
      [
        { role: "system", content: moderationSystem },
        { role: "user", content: text },
      ],
      moderationSchema,
      { temperature: 0, maxTokens: 200 },
    );
  } catch (err) {
    console.warn("[moderation] check failed, allowing:", (err as Error).message);
    return { allowed: true, category: "none", severity: 0, reason: null };
  }
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
