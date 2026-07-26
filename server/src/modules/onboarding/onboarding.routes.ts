import type { FastifyInstance, FastifyReply } from "fastify";
import { Profile } from "../../db/models/Profile.js";
import { uploadMedia, deleteMedia, signedReadUrl, validateMedia } from "../../lib/storage/gcs.js";
import { enqueueJob } from "../../lib/jobs.js";
import { syncProfileVector } from "./vector-sync.js";
import { ONBOARDING_CONFIG, PROMPTS } from "./onboarding.data.js";
import {
  basicsSchema,
  intentSchema,
  interestsSchema,
  personalitySchema,
  promptsSchema,
  valuesSchema,
} from "./onboarding.schemas.js";

/** Section order drives step math. Voice is optional (step still advances). */
const SECTION_ORDER = ["basics", "intent", "personality", "values", "interests", "prompts", "voice"] as const;

function stepAfter(section: (typeof SECTION_ORDER)[number]): number {
  return SECTION_ORDER.indexOf(section) + 1;
}

async function getOrCreateProfile(userId: string) {
  return (await Profile.findOne({ userId })) ?? (await Profile.create({ userId }));
}

/** Post-completion edits change the matching substrate — re-embed async. */
function resyncIfCompleted(p: InstanceType<typeof Profile>): void {
  if (p.onboarding?.completed) {
    void syncProfileVector(p);
  }
}

function bad(reply: FastifyReply, message: string) {
  return reply.status(400).send({ error: message });
}

export async function onboardingRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", app.authenticate);

  app.get("/onboarding/config", async () => ONBOARDING_CONFIG);

  app.get("/onboarding/state", async (req) => {
    const p = await getOrCreateProfile(req.user.sub);
    return {
      step: p.onboarding?.step ?? 0,
      completed: p.onboarding?.completed ?? false,
      sections: {
        basics: p.basics,
        intent: p.intent,
        personality: p.personality ? Object.fromEntries(p.personality) : null,
        values: p.values ?? null,
        interests: p.interests ?? null,
        prompts: p.prompts ?? null,
        voiceIntro: p.voiceIntro
          ? {
              durationSec: p.voiceIntro.durationSec,
              // Signing needs a service account (Cloud Run). Local dev user
              // creds can't sign — degrade to null instead of 500ing state.
              url: await signedReadUrl(p.voiceIntro.objectPath).catch(() => null),
            }
          : null,
      },
    };
  });

  /* ---------- section saves ---------- */

  app.put("/onboarding/basics", async (req, reply) => {
    const parsed = basicsSchema.safeParse(req.body);
    if (!parsed.success) return bad(reply, parsed.error.issues[0]?.message ?? "Invalid input");
    const p = await getOrCreateProfile(req.user.sub);
    p.set("basics", parsed.data);
    p.set("onboarding.step", Math.max(p.onboarding?.step ?? 0, stepAfter("basics")));
    await p.save();
    resyncIfCompleted(p);
    return { ok: true, step: p.onboarding?.step };
  });

  app.put("/onboarding/intent", async (req, reply) => {
    const parsed = intentSchema.safeParse(req.body);
    if (!parsed.success) return bad(reply, "Pick an intent");
    const p = await getOrCreateProfile(req.user.sub);
    p.set("intent", parsed.data.intent);
    p.set("onboarding.step", Math.max(p.onboarding?.step ?? 0, stepAfter("intent")));
    await p.save();
    resyncIfCompleted(p);
    return { ok: true, step: p.onboarding?.step };
  });

  app.put("/onboarding/personality", async (req, reply) => {
    const parsed = personalitySchema.safeParse(req.body);
    if (!parsed.success) return bad(reply, parsed.error.issues[0]?.message ?? "Answer every question");
    const p = await getOrCreateProfile(req.user.sub);
    p.set("personality", parsed.data.answers);
    p.set("onboarding.step", Math.max(p.onboarding?.step ?? 0, stepAfter("personality")));
    await p.save();
    resyncIfCompleted(p);
    return { ok: true, step: p.onboarding?.step };
  });

  app.put("/onboarding/values", async (req, reply) => {
    const parsed = valuesSchema.safeParse(req.body);
    if (!parsed.success) return bad(reply, "Pick 3 to 5 values");
    const p = await getOrCreateProfile(req.user.sub);
    p.set("values", parsed.data.values);
    p.set("onboarding.step", Math.max(p.onboarding?.step ?? 0, stepAfter("values")));
    await p.save();
    resyncIfCompleted(p);
    return { ok: true, step: p.onboarding?.step };
  });

  app.put("/onboarding/interests", async (req, reply) => {
    const parsed = interestsSchema.safeParse(req.body);
    if (!parsed.success) return bad(reply, "Pick 3 to 8 interests");
    const p = await getOrCreateProfile(req.user.sub);
    p.set("interests", parsed.data.interests);
    p.set("onboarding.step", Math.max(p.onboarding?.step ?? 0, stepAfter("interests")));
    await p.save();
    resyncIfCompleted(p);
    return { ok: true, step: p.onboarding?.step };
  });

  app.put("/onboarding/prompts", async (req, reply) => {
    const parsed = promptsSchema.safeParse(req.body);
    if (!parsed.success) return bad(reply, parsed.error.issues[0]?.message ?? "Answer at least 2 prompts");
    const p = await getOrCreateProfile(req.user.sub);
    p.set(
      "prompts",
      parsed.data.prompts.map((pr) => ({
        promptId: pr.promptId,
        question: PROMPTS.find((q) => q.id === pr.promptId)?.question ?? pr.promptId,
        answer: pr.answer,
      })),
    );
    p.set("onboarding.step", Math.max(p.onboarding?.step ?? 0, stepAfter("prompts")));
    await p.save();
    resyncIfCompleted(p);
    return { ok: true, step: p.onboarding?.step };
  });

  /* ---------- voice intro (optional) ---------- */

  app.post("/onboarding/voice", async (req, reply) => {
    const file = await req.file();
    if (!file) return bad(reply, "No audio file");
    const buf = await file.toBuffer();
    const invalid = validateMedia("voice-intro", file.mimetype, buf.length);
    if (invalid) return bad(reply, invalid);

    const p = await getOrCreateProfile(req.user.sub);
    if (p.voiceIntro?.objectPath) await deleteMedia(p.voiceIntro.objectPath).catch(() => undefined);

    const durationSec = Number((file.fields.durationSec as { value?: string } | undefined)?.value ?? 0);
    const objectPath = await uploadMedia("voice-intro", req.user.sub, file.mimetype, buf);
    p.set("voiceIntro", { objectPath, mimeType: file.mimetype, durationSec, transcript: null });
    p.set("onboarding.step", Math.max(p.onboarding?.step ?? 0, stepAfter("voice")));
    await p.save();
    // Epic 5: transcription + tone read, async — enriches matching when done.
    await enqueueJob("voice-transcribe", { userId: req.user.sub });
    return { ok: true, url: await signedReadUrl(objectPath).catch(() => null), step: p.onboarding?.step };
  });

  app.delete("/onboarding/voice", async (req) => {
    const p = await getOrCreateProfile(req.user.sub);
    if (p.voiceIntro?.objectPath) await deleteMedia(p.voiceIntro.objectPath).catch(() => undefined);
    p.set("voiceIntro", null);
    p.set("onboarding.step", Math.max(p.onboarding?.step ?? 0, stepAfter("voice")));
    await p.save();
    resyncIfCompleted(p);
    return { ok: true, step: p.onboarding?.step };
  });

  /* ---------- complete → embed into Upstash Vector ---------- */

  app.post("/onboarding/complete", async (req, reply) => {
    const p = await getOrCreateProfile(req.user.sub);
    const missing: string[] = [];
    if (!p.basics) missing.push("basics");
    if (!p.intent) missing.push("intent");
    if (!p.personality || p.personality.size === 0) missing.push("personality");
    if (!p.values?.length) missing.push("values");
    if (!p.interests?.length) missing.push("interests");
    if (!p.prompts?.length) missing.push("prompts");
    if (missing.length) return bad(reply, `Incomplete sections: ${missing.join(", ")}`);

    p.set("onboarding.completed", true);
    p.set("onboarding.completedAt", new Date());
    p.set("onboarding.step", SECTION_ORDER.length);
    await p.save();
    await syncProfileVector(p);
    return { ok: true, completed: true };
  });
}
