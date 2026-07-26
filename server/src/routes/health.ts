import type { FastifyInstance } from "fastify";
import mongoose from "mongoose";

/** Liveness + dependency snapshot. Cloud Run health checks hit this. */
export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => ({
    status: "ok",
    uptime: process.uptime(),
    mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  }));
}
