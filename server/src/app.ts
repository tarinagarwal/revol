import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { healthRoutes } from "./routes/health.js";
import { versionRoutes } from "./routes/version.js";
import multipart from "@fastify/multipart";
import { authPlugin } from "./plugins/auth.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { onboardingRoutes } from "./modules/onboarding/onboarding.routes.js";
import { mediaRoutes } from "./modules/media/media.routes.js";
import { discoveryRoutes } from "./modules/discovery/discovery.routes.js";
import { profileRoutes } from "./modules/profile/profile.routes.js";
import { aiRoutes } from "./modules/ai/ai.routes.js";
import { jobRoutes } from "./routes/jobs.js";
import { matchesRoutes } from "./modules/matches/matches.routes.js";
import { preferencesRoutes } from "./modules/preferences/preferences.routes.js";
import { chatRoutes } from "./modules/chat/chat.routes.js";
import { safetyRoutes } from "./modules/safety/safety.routes.js";
import { verificationRoutes } from "./modules/verification/verification.routes.js";
import { privacyRoutes } from "./modules/privacy/privacy.routes.js";
import "./modules/ai/ai.jobs.js"; // registers job handlers (side effect)
import "./modules/discovery/discovery.jobs.js"; // daily-matches cron handler
import "./modules/chat/chat.jobs.js"; // reveal + voice-note handlers

/** Builds the Fastify app. Plugins + module routes register here per epic. */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: { level: "info" },
  });

  await app.register(cors, {
    // Tightened per-environment in Epic 18 (web origin + capacitor:// + file://)
    origin: true,
    // Default is CORS-safelisted only (GET/HEAD/POST) — browsers were blocking
    // every PUT/DELETE (all onboarding section saves). Be explicit.
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  await app.register(authPlugin);
  await app.register(multipart, { limits: { fileSize: 15 * 1024 * 1024, files: 1 } });

  await app.register(healthRoutes);
  await app.register(versionRoutes);
  await app.register(authRoutes);
  await app.register(onboardingRoutes);
  await app.register(mediaRoutes);
  await app.register(discoveryRoutes);
  await app.register(matchesRoutes);
  await app.register(profileRoutes);
  await app.register(preferencesRoutes);
  await app.register(chatRoutes);
  await app.register(safetyRoutes);
  await app.register(verificationRoutes);
  await app.register(privacyRoutes);
  await app.register(aiRoutes);
  await app.register(jobRoutes);

  return app;
}
