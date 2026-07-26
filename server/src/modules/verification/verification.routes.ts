import type { FastifyInstance } from "fastify";
import { Media } from "../../db/models/Media.js";
import { User } from "../../db/models/User.js";
import { MAX_VERIFICATION_ATTEMPTS, Verification } from "../../db/models/Verification.js";
import { deleteMedia, downloadMedia, uploadMedia, validateMedia } from "../../lib/storage/gcs.js";
import { verifySelfie } from "../ai/ai.service.js";

async function getOrCreate(userId: string) {
  return (await Verification.findOne({ userId })) ?? (await Verification.create({ userId }));
}

/** Epic 9 — identity verification. The selfie is compared, then destroyed. */
export async function verificationRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", app.authenticate);

  app.get("/verification/status", async (req) => {
    const v = await getOrCreate(req.user.sub);
    return {
      status: v.status,
      attempts: v.attempts,
      attemptsLeft: Math.max(0, MAX_VERIFICATION_ATTEMPTS - (v.attempts ?? 0)),
      reason: v.reason,
      verifiedAt: v.verifiedAt,
    };
  });

  app.post("/verification/selfie", async (req, reply) => {
    const v = await getOrCreate(req.user.sub);
    if (v.status === "verified") return reply.send({ status: "verified", reason: null });
    if ((v.attempts ?? 0) >= MAX_VERIFICATION_ATTEMPTS) {
      return reply.status(429).send({ error: "Too many attempts — contact support to verify manually" });
    }

    const primary = await Media.findOne({ userId: req.user.sub, kind: "photo", status: "active", position: 0 });
    if (!primary) {
      return reply.status(400).send({ error: "Add a profile photo before verifying" });
    }

    const file = await req.file();
    if (!file) return reply.status(400).send({ error: "No selfie provided" });
    const buf = await file.toBuffer();
    const invalid = validateMedia("photo", file.mimetype, buf.length);
    if (invalid) return reply.status(400).send({ error: invalid });

    v.set("status", "pending");
    v.set("attempts", (v.attempts ?? 0) + 1);
    v.set("lastAttemptAt", new Date());
    await v.save();

    // Stored only for the duration of the check, then removed.
    const selfiePath = await uploadMedia("photo", req.user.sub, file.mimetype, buf);
    try {
      const profileBuf = await downloadMedia(primary.objectPath);
      if (profileBuf.length < 1024) {
        // Stored object is empty or unreadable — tell them plainly instead of
        // failing deep inside the vision call.
        v.set("status", "unverified");
        v.set("reason", "Your profile photo couldn't be read. Please re-upload it and try again.");
        await v.save();
        return reply.status(400).send({ error: v.reason });
      }
      const result = await verifySelfie(
        { buffer: buf, mimeType: file.mimetype },
        { buffer: profileBuf, mimeType: primary.mimeType },
      );

      const passed = result.isLivePerson && result.matchesProfile && result.confidence >= 60;
      v.set("ai", {
        isLivePerson: result.isLivePerson,
        matchesProfile: result.matchesProfile,
        confidence: result.confidence,
      });
      v.set("status", passed ? "verified" : "rejected");
      v.set("reason", passed ? null : (result.reason ?? "We couldn't confirm it's you — try again in good light."));
      if (passed) v.set("verifiedAt", new Date());
      await v.save();
      await User.updateOne({ _id: req.user.sub }, { verified: passed });

      return reply.send({ status: v.status, reason: v.reason, attemptsLeft: Math.max(0, MAX_VERIFICATION_ATTEMPTS - (v.attempts ?? 0)) });
    } catch (err) {
      v.set("status", "unverified");
      v.set("reason", "Verification service unavailable — please try again shortly.");
      await v.save();
      req.log.warn({ err }, "verification failed");
      return reply.status(502).send({ error: v.reason });
    } finally {
      // The selfie is never kept, whatever the outcome.
      await deleteMedia(selfiePath).catch(() => undefined);
    }
  });
}
