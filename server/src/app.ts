import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { healthRoutes } from "./routes/health.js";
import { versionRoutes } from "./routes/version.js";
/** Builds the Fastify app. Plugins + module routes register here per epic. */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: { level: "info" },
  });

  await app.register(cors, {
    // Tightened per-environment in Epic 18 (web origin + capacitor:// + file://)
    origin: true,
  });

  await app.register(healthRoutes);
  await app.register(versionRoutes);

  return app;
}
