import { Media } from "../../db/models/Media.js";
import { Profile } from "../../db/models/Profile.js";
import { getVector } from "../../lib/upstash.js";
import { registerJobHandler } from "../../lib/jobs.js";
import { downloadMedia } from "../../lib/storage/gcs.js";
import { analyzePhoto, analyzeVoice } from "./ai.service.js";
import { buildProfileText } from "../onboarding/profile-text.js";

/**
 * Async AI post-processing (Epic 5). Fired after uploads — QStash in prod,
 * inline in dev. Failures leave media analyzable later, never break UX.
 */

registerJobHandler("photo-analyze", async (payload) => {
  const mediaId = String(payload.mediaId ?? "");
  const media = await Media.findById(mediaId);
  if (!media || media.status !== "active") return;

  const buf = await downloadMedia(media.objectPath);
  const result = await analyzePhoto(buf, media.mimeType);
  media.set("ai", {
    analyzed: true,
    isHuman: result.isHuman,
    safe: result.safe,
    quality: result.quality,
    description: result.description,
    flaggedReason: result.flaggedReason,
  });
  await media.save();
  console.log(`[jobs] photo ${mediaId} analyzed: human=${result.isHuman} safe=${result.safe} q=${result.quality}`);
});

registerJobHandler("voice-transcribe", async (payload) => {
  const userId = String(payload.userId ?? "");
  const profile = await Profile.findOne({ userId });
  if (!profile?.voiceIntro?.objectPath) return;

  const buf = await downloadMedia(profile.voiceIntro.objectPath);
  const result = await analyzeVoice(buf, profile.voiceIntro.mimeType);
  profile.set("voiceIntro.transcript", result.transcript ? `${result.transcript} (Tone: ${result.tone})` : null);
  await profile.save();

  // Transcript enriches the matching substrate — resync the embedding.
  if (profile.onboarding?.completed) {
    await getVector()
      .upsert({
        id: `profile:${userId}`,
        data: buildProfileText(profile),
        metadata: {
          userId,
          gender: profile.basics?.gender ?? "",
          interestedIn: profile.basics?.interestedIn ?? [],
          intent: profile.intent ?? "",
          city: profile.basics?.city ?? "",
        },
      })
      .catch((err) => console.warn("[jobs] vector resync failed:", (err as Error).message));
    profile.set("vectorSyncedAt", new Date());
    await profile.save();
  }
  console.log(`[jobs] voice transcribed for ${userId}: "${result.transcript.slice(0, 60)}..."`);
});
