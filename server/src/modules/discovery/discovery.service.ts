import { Types } from "mongoose";
import { DailyMatch } from "../../db/models/DailyMatch.js";
import { Profile } from "../../db/models/Profile.js";
import { User } from "../../db/models/User.js";
import { Media } from "../../db/models/Media.js";
import { getVector } from "../../lib/upstash.js";
import { signedReadUrl } from "../../lib/storage/gcs.js";
import { compatibilityReport } from "../ai/ai.service.js";
import { buildProfileText } from "../onboarding/profile-text.js";

export class DiscoveryError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Orientation must hold in BOTH directions. */
function orientationCompatible(
  a: { gender: string; interestedIn: string[] },
  b: { gender: string; interestedIn: string[] },
): boolean {
  const wants = (seeker: string[], gender: string) =>
    seeker.includes("everyone") ||
    (gender === "woman" && seeker.includes("women")) ||
    (gender === "man" && seeker.includes("men")) ||
    (gender === "nonbinary" && seeker.includes("nonbinary")) ||
    (gender === "other" && seeker.includes("nonbinary"));
  return wants(a.interestedIn, b.gender) && wants(b.interestedIn, a.gender);
}

function age(birthdate: Date): number {
  return Math.floor((Date.now() - birthdate.getTime()) / (365.25 * 86_400_000));
}

/** Finds the best fresh candidate via Vector similarity, then AI-scores it. */
async function generateMatch(userId: string, day: string) {
  const me = await Profile.findOne({ userId });
  if (!me?.onboarding?.completed || !me.basics) throw new DiscoveryError(400, "Finish onboarding first");

  // Everyone this user has already been shown — never repeat.
  const seen = await DailyMatch.find({ userId }).select("candidateUserId");
  const excluded = new Set(seen.map((s) => String(s.candidateUserId)));
  excluded.add(userId);

  const hits = await getVector().query({
    data: buildProfileText(me),
    topK: 25,
    includeMetadata: true,
  });

  for (const hit of hits) {
    const candidateId = String(hit.metadata?.userId ?? String(hit.id).replace("profile:", ""));
    if (excluded.has(candidateId)) continue;

    const candidate = await Profile.findOne({ userId: candidateId });
    if (!candidate?.onboarding?.completed || !candidate.basics) continue;
    if (!orientationCompatible(me.basics, candidate.basics)) continue;

    // AI chemistry read — the substance of the card.
    const report = await compatibilityReport(userId, candidateId).catch(() => null);
    if (!report) continue;

    return DailyMatch.create({
      userId,
      candidateUserId: candidateId,
      day,
      compatibility: report,
      similarity: hit.score ?? 0,
      revealLevel: 3,
      status: "pending",
    });
  }
  return null;
}

/** Serializes a match card — veiled by revealLevel, substance always visible. */
export async function matchCard(match: InstanceType<typeof DailyMatch>) {
  const [candidate, user] = await Promise.all([
    Profile.findOne({ userId: match.candidateUserId }),
    User.findById(match.candidateUserId),
  ]);
  if (!candidate?.basics || !user) return null;

  const photo = await Media.findOne({
    userId: match.candidateUserId,
    kind: "photo",
    status: "active",
    position: 0,
  });
  const photoUrl = photo ? await signedReadUrl(photo.objectPath).catch(() => null) : null;
  const voiceUrl = candidate.voiceIntro?.objectPath
    ? await signedReadUrl(candidate.voiceIntro.objectPath).catch(() => null)
    : null;

  const revealed = match.revealLevel === 0;
  return {
    id: String(match._id),
    day: match.day,
    status: match.status,
    revealLevel: match.revealLevel,
    compatibility: match.compatibility,
    candidate: {
      // Identity stays veiled until the reveal.
      displayName: revealed ? user.displayName : null,
      firstInitial: user.displayName.charAt(0).toUpperCase(),
      age: age(candidate.basics.birthdate),
      city: candidate.basics.city,
      intent: candidate.intent,
      values: candidate.values ?? [],
      interests: candidate.interests ?? [],
      prompts: candidate.prompts ?? [],
      voiceUrl, // heard before seen — the brand promise
      photoUrl, // client blurs by revealLevel; server still gates identity
    },
  };
}

export async function getToday(userId: string) {
  const day = todayKey();
  let match = await DailyMatch.findOne({ userId, day });
  match ??= await generateMatch(userId, day);
  if (!match) return { match: null };
  return { match: await matchCard(match) };
}

export async function actOnToday(userId: string, action: "like" | "pass") {
  const match = await DailyMatch.findOne({ userId, day: todayKey() });
  if (!match) throw new DiscoveryError(404, "No match today");
  if (match.status !== "pending") throw new DiscoveryError(400, "Already acted");

  match.set("status", action === "like" ? "liked" : "passed");
  match.set("actedAt", new Date());
  await match.save();

  // Mutual detection + Match lifecycle arrive with Epic 7.
  return { status: match.status };
}

/** DEV_MODE only — wipe today's suggestion to test generation repeatedly. */
export async function devRefresh(userId: string) {
  await DailyMatch.deleteOne({ userId, day: todayKey() });
  return getToday(userId);
}

export function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}
