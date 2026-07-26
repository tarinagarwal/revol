import type { FastifyInstance } from "fastify";
import { Profile } from "../../db/models/Profile.js";
import { User } from "../../db/models/User.js";
import { Media } from "../../db/models/Media.js";
import { signedReadUrl } from "../../lib/storage/gcs.js";

function age(birthdate: Date): number {
  return Math.floor((Date.now() - birthdate.getTime()) / (365.25 * 86_400_000));
}

/** Epic 6 — own-profile read model (edits reuse the onboarding PUTs). */
export async function profileRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", app.authenticate);

  app.get("/profile/me", async (req, reply) => {
    const [user, profile, photos] = await Promise.all([
      User.findById(req.user.sub),
      Profile.findOne({ userId: req.user.sub }),
      Media.find({ userId: req.user.sub, kind: "photo", status: "active" }).sort({ position: 1 }),
    ]);
    if (!user || !profile) return reply.status(404).send({ error: "Profile not found" });

    return {
      profile: {
        displayName: user.displayName,
        email: user.email,
        age: profile.basics ? age(profile.basics.birthdate) : null,
        city: profile.basics?.city ?? null,
        gender: profile.basics?.gender ?? null,
        interestedIn: profile.basics?.interestedIn ?? [],
        intent: profile.intent,
        personality: profile.personality ? Object.fromEntries(profile.personality) : null,
        values: profile.values ?? [],
        interests: profile.interests ?? [],
        prompts: profile.prompts ?? [],
        voiceIntro: profile.voiceIntro
          ? {
              durationSec: profile.voiceIntro.durationSec,
              transcript: profile.voiceIntro.transcript,
              url: await signedReadUrl(profile.voiceIntro.objectPath).catch(() => null),
            }
          : null,
        photos: await Promise.all(
          photos.map(async (p) => ({
            id: String(p._id),
            position: p.position,
            url: await signedReadUrl(p.objectPath).catch(() => null),
          })),
        ),
        onboardingCompleted: profile.onboarding?.completed ?? false,
      },
    };
  });
}
