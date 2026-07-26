import type { FastifyInstance } from "fastify";
import { z } from "zod";
import argon2 from "argon2";
import { Block } from "../../db/models/Block.js";
import { DailyMatch } from "../../db/models/DailyMatch.js";
import { Match } from "../../db/models/Match.js";
import { Media } from "../../db/models/Media.js";
import { Message } from "../../db/models/Message.js";
import { Preferences, getOrCreatePreferences } from "../../db/models/Preferences.js";
import { Profile } from "../../db/models/Profile.js";
import { Report } from "../../db/models/Report.js";
import { Session } from "../../db/models/Session.js";
import { User } from "../../db/models/User.js";
import { Verification } from "../../db/models/Verification.js";
import { deleteMedia } from "../../lib/storage/gcs.js";
import { getVector } from "../../lib/upstash.js";

const privacySchema = z.object({
  showCity: z.boolean().optional(),
  showAge: z.boolean().optional(),
  allowVoicePlayback: z.boolean().optional(),
  readReceipts: z.boolean().optional(),
});

/** Epic 9 — data visibility, export, and permanent deletion. */
export async function privacyRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", app.authenticate);

  app.get("/privacy/settings", async (req) => {
    const p = await getOrCreatePreferences(req.user.sub);
    return {
      privacy: {
        showCity: p.privacy?.showCity ?? true,
        showAge: p.privacy?.showAge ?? true,
        allowVoicePlayback: p.privacy?.allowVoicePlayback ?? true,
        readReceipts: p.privacy?.readReceipts ?? true,
      },
    };
  });

  app.put("/privacy/settings", async (req, reply) => {
    const parsed = privacySchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Invalid settings" });
    const p = await getOrCreatePreferences(req.user.sub);
    p.set("privacy", { ...(p.privacy ?? {}), ...parsed.data });
    await p.save();
    return {
      privacy: {
        showCity: p.privacy?.showCity ?? true,
        showAge: p.privacy?.showAge ?? true,
        allowVoicePlayback: p.privacy?.allowVoicePlayback ?? true,
        readReceipts: p.privacy?.readReceipts ?? true,
      },
    };
  });

  /** Everything we hold about this member, in one JSON download. */
  app.get("/privacy/export", async (req, reply) => {
    const userId = req.user.sub;
    const [user, profile, prefs, media, matches, verification, blocks, dailyMatches] = await Promise.all([
      User.findById(userId),
      Profile.findOne({ userId }),
      Preferences.findOne({ userId }),
      Media.find({ userId, status: "active" }),
      Match.find({ users: userId }),
      Verification.findOne({ userId }),
      Block.find({ blockerId: userId }),
      DailyMatch.find({ userId }),
    ]);
    const messages = await Message.find({ matchId: { $in: matches.map((m) => m._id) }, senderId: userId });

    const dump = {
      exportedAt: new Date().toISOString(),
      account: {
        email: user?.email,
        displayName: user?.displayName,
        emailVerified: user?.emailVerified,
        identityVerified: user?.verified,
        createdAt: user?.createdAt,
        lastLoginAt: user?.lastLoginAt,
      },
      profile: profile
        ? {
            basics: profile.basics,
            intent: profile.intent,
            personality: profile.personality ? Object.fromEntries(profile.personality) : null,
            values: profile.values,
            interests: profile.interests,
            prompts: profile.prompts,
            voiceIntro: profile.voiceIntro
              ? { durationSec: profile.voiceIntro.durationSec, transcript: profile.voiceIntro.transcript }
              : null,
            onboarding: profile.onboarding,
          }
        : null,
      preferences: prefs,
      photos: media.map((m) => ({ position: m.position, uploadedAt: m.createdAt, aiReview: m.ai })),
      verification: verification
        ? { status: verification.status, verifiedAt: verification.verifiedAt, attempts: verification.attempts }
        : null,
      introductions: dailyMatches.map((d) => ({ day: d.day, status: d.status, chemistry: d.compatibility?.score })),
      matches: matches.map((m) => ({
        id: String(m._id),
        matchedAt: m.matchedAt,
        status: m.status,
        revealLevel: m.revealLevel,
        chemistry: m.compatibility?.score,
      })),
      messagesSent: messages.map((m) => ({
        matchId: String(m.matchId),
        kind: m.kind,
        body: m.kind === "voice" ? "[voice note]" : m.body,
        sentAt: m.createdAt,
      })),
      blocks: blocks.map((b) => ({ userId: String(b.blockedId), blockedAt: b.createdAt })),
    };

    return reply
      .header("Content-Disposition", `attachment; filename="revol-data-${userId}.json"`)
      .type("application/json")
      .send(dump);
  });

  /** Permanent deletion — account, media, embeddings, sessions, everything. */
  app.delete("/privacy/account", async (req, reply) => {
    const parsed = z.object({ password: z.string().min(1) }).safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Password required to delete your account" });

    const user = await User.findById(req.user.sub);
    if (!user) return reply.status(404).send({ error: "Account not found" });
    const ok = await argon2.verify(user.passwordHash, parsed.data.password).catch(() => false);
    if (!ok) return reply.status(401).send({ error: "Incorrect password" });

    const userId = req.user.sub;

    // Remove stored media objects first — they outlive the database rows.
    const media = await Media.find({ userId });
    for (const m of media) await deleteMedia(m.objectPath).catch(() => undefined);
    const profile = await Profile.findOne({ userId });
    if (profile?.voiceIntro?.objectPath) await deleteMedia(profile.voiceIntro.objectPath).catch(() => undefined);

    // Drop the matching embedding so they can never be surfaced again.
    await getVector()
      .delete(`profile:${userId}`)
      .catch(() => undefined);

    const matches = await Match.find({ users: userId });
    await Promise.all([
      Message.deleteMany({ senderId: userId }),
      Match.updateMany({ _id: { $in: matches.map((m) => m._id) } }, { status: "unmatched" }),
      DailyMatch.deleteMany({ $or: [{ userId }, { candidateUserId: userId }] }),
      Media.deleteMany({ userId }),
      Profile.deleteOne({ userId }),
      Preferences.deleteOne({ userId }),
      Verification.deleteOne({ userId }),
      Block.deleteMany({ $or: [{ blockerId: userId }, { blockedId: userId }] }),
      Session.deleteMany({ userId }),
      // Reports are retained for moderation integrity but de-identified.
      Report.updateMany({ reporterId: userId }, { $set: { details: "[account deleted]" } }),
      User.deleteOne({ _id: userId }),
    ]);

    return { ok: true, deleted: true };
  });
}
