import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { env } from "../../config/env.js";
import { DiscoveryError, actOnToday, devRefresh, getToday } from "./discovery.service.js";

/** Epic 6 — the daily match. One meaningful suggestion, no infinite scroll. */
export async function discoveryRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", app.authenticate);

  app.get("/discovery/today", async (req, reply) => {
    try {
      return await getToday(req.user.sub);
    } catch (err) {
      if (err instanceof DiscoveryError) return reply.status(err.status).send({ error: err.message });
      throw err;
    }
  });

  app.post("/discovery/today/act", async (req, reply) => {
    const parsed = z.object({ action: z.enum(["like", "pass"]) }).safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Invalid action" });
    try {
      return await actOnToday(req.user.sub, parsed.data.action);
    } catch (err) {
      if (err instanceof DiscoveryError) return reply.status(err.status).send({ error: err.message });
      throw err;
    }
  });

  app.post("/discovery/refresh", async (req, reply) => {
    if (!env.DEV_MODE) return reply.status(403).send({ error: "Dev only" });
    return devRefresh(req.user.sub);
  });
}
