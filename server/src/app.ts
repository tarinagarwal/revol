import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { healthRoutes } from "./routes/health.js";
import { versionRoutes } from "./routes/version.js";
import { authPlugin } from "./plugins/auth.js";
import { authRoutes } from "./modules/auth/auth.routes.js";

/** Builds the Fastify app. Plugins + module routes register here per epic. */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: { level: "info" },
  });

  await app.register(cors, {
    // Tightened per-environment in Epic 18 (web origin + capacitor:// + file://)
    origin: true,
  });

  await app.register(authPlugin);

  await app.register(healthRoutes);
  await app.register(versionRoutes);
  await app.register(authRoutes);

  return app;
}
