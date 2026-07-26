import { Types } from "mongoose";
import { DailyMatch } from "../../db/models/DailyMatch.js";
import { Match, pairKeyFor } from "../../db/models/Match.js";
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

/**
 * People who already liked this user and are still unanswered — they jump
 * the queue. Mutuality can actually happen under one-a-day pacing.
 */
async function pendingLikers(userId: string, excluded: Set<string>): Promise<string[]> {
  const likes = await DailyMatch.find({ candidateUserId: userId, status: "liked" }).sort({ actedAt: -1 });
  return likes.map((l) => String(l.userId)).filter((id) => !excluded.has(id));
}

/** Finds the best fresh candidate — likers first, then Vector similarity. */
async function generateMatch(userId: string, day: string) {
  const me = await Profile.findOne({ userId });
  if (!me?.onboarding?.completed || !me.basics) throw new DiscoveryError(400, "Finish onboarding first");

  // Everyone this user has already been shown — never repeat.
  const seen = await DailyMatch.find({ userId }).select("candidateUserId");
  const excluded = new Set(seen.map((s) => String(s.candidateUserId)));
  excluded.add(userId);
  // Existing mutual matches are off the queue too.
  const myMatches = await Match.find({ users: userId, status: "active" });
  for (const m of myMatches) {
    for (const u of m.users) excluded.add(String(u));
  }

  const likerIds = await pendingLikers(userId, excluded);
  const vectorHits = await getVector().query({
    data: buildProfileText(me),
    topK: 25,
    includeMetadata: true,
  });
  const vectorIds = vectorHits.map((h) => ({
    id: String(h.metadata?.userId ?? String(h.id).replace("profile:", "")),
    score: h.score ?? 0,
  }));

  const queue: { id: string; score: number }[] = [
    ...likerIds.map((id) => ({ id, score: 1 })), // likers first — someone chose you
    ...vectorIds,
  ];

  const tried = new Set<string>();
  for (const entry of queue) {
    if (excluded.has(entry.id) || tried.has(entry.id)) continue;
    tried.add(entry.id);

    const candidate = await Profile.findOne({ userId: entry.id });
    if (!candidate?.onboarding?.completed || !candidate.basics) continue;
    if (!orientationCompatible(me.basics, candidate.basics)) continue;

    // AI chemistry read — the substance of the card.
    const report = await compatibilityReport(userId, entry.id).catch(() => null);
    if (!report) continue;

    return DailyMatch.create({
      userId,
      candidateUserId: entry.id,
      day,
      compatibility: report,
      similarity: entry.score,
      revealLevel: 3,
      status: "pending",
    });
  }
  return null;
}

/** A person, serialized at a reveal level — identity gated server-side. */
export async function personCard(candidateUserId: string, revealLevel: number) {
  const [candidate, user] = await Promise.all([
    Profile.findOne({ userId: candidateUserId }),
    User.findById(candidateUserId),
  ]);
  if (!candidate?.basics || !user) return null;

  const photo = await Media.findOne({ userId: candidateUserId, kind: "photo", status: "active", position: 0 });
  const photoUrl = photo ? await signedReadUrl(photo.objectPath).catch(() => null) : null;
  const voiceUrl = candidate.voiceIntro?.objectPath
    ? await signedReadUrl(candidate.voiceIntro.objectPath).catch(() => null)
    : null;

  const revealed = revealLevel === 0;
  return {
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
  };
}

/** Serializes the daily suggestion card. */
export async function matchCard(match: InstanceType<typeof DailyMatch>) {
  const candidate = await personCard(String(match.candidateUserId), match.revealLevel);
  if (!candidate) return null;
  return {
    id: String(match._id),
    day: match.day,
    status: match.status,
    revealLevel: match.revealLevel,
    compatibility: match.compatibility,
    candidate,
  };
}

/** Mutual matches — list + detail (Epic 7). */
export async function listMatches(userId: string) {
  const matches = await Match.find({ users: userId, status: "active" }).sort({ matchedAt: -1 });
  const cards = await Promise.all(
    matches.map(async (m) => {
      const otherId = m.users.map(String).find((u) => u !== userId);
      if (!otherId) return null;
      const person = await personCard(otherId, m.revealLevel);
      if (!person) return null;
      return {
        id: String(m._id),
        revealLevel: m.revealLevel,
        compatibility: m.compatibility,
        matchedAt: m.matchedAt,
        messageCount: m.messageCount,
        person,
      };
    }),
  );
  return cards.filter(Boolean);
}

export async function getMatchDetail(userId: string, matchId: string) {
  if (!Types.ObjectId.isValid(matchId)) throw new DiscoveryError(404, "Match not found");
  const m = await Match.findOne({ _id: matchId, users: userId, status: "active" });
  if (!m) throw new DiscoveryError(404, "Match not found");
  const otherId = m.users.map(String).find((u) => u !== userId);
  const person = otherId ? await personCard(otherId, m.revealLevel) : null;
  if (!person) throw new DiscoveryError(404, "Match not found");
  return {
    id: String(m._id),
    revealLevel: m.revealLevel,
    compatibility: m.compatibility,
    matchedAt: m.matchedAt,
    messageCount: m.messageCount,
    person,
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

  // Mutual detection — did they already reach for you?
  if (action === "like") {
    const candidateId = String(match.candidateUserId);
    const reciprocal = await DailyMatch.findOne({
      userId: candidateId,
      candidateUserId: userId,
      status: "liked",
    });
    if (reciprocal) {
      const pairKey = pairKeyFor(userId, candidateId);
      const existing = await Match.findOne({ pairKey });
      const mutual =
        existing ??
        (await Match.create({
          users: [userId, candidateId].sort(),
          pairKey,
          revealLevel: 2, // mutuality lifts the first veil
          compatibility: match.compatibility,
        }));
      return { status: match.status, mutual: true, matchId: String(mutual._id) };
    }
  }

  return { status: match.status, mutual: false };
}

/** DEV_MODE only — wipe today's suggestion to test generation repeatedly. */
export async function devRefresh(userId: string) {
  await DailyMatch.deleteOne({ userId, day: todayKey() });
  return getToday(userId);
}

export function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}
