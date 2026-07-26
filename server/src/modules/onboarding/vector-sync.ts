import { Profile } from "../../db/models/Profile.js";
import { getVector } from "../../lib/upstash.js";
import { buildProfileText } from "./profile-text.js";

/**
 * Upserts a profile's narrative into Upstash Vector (hosted BGE_M3).
 * Called on onboarding completion, any post-completion edit, and after
 * voice transcription. Never throws — matching degrades, UX doesn't.
 */
export async function syncProfileVector(profile: InstanceType<typeof Profile>): Promise<boolean> {
  try {
    await getVector().upsert({
      id: `profile:${String(profile.userId)}`,
      data: buildProfileText(profile),
      metadata: {
        userId: String(profile.userId),
        gender: profile.basics?.gender ?? "",
        interestedIn: profile.basics?.interestedIn ?? [],
        intent: profile.intent ?? "",
        city: profile.basics?.city ?? "",
      },
    });
    profile.set("vectorSyncedAt", new Date());
    await profile.save();
    return true;
  } catch (err) {
    console.warn("[vector] profile sync failed:", (err as Error).message);
    return false;
  }
}
