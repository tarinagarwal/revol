import type { FastifyInstance } from "fastify";
import { DiscoveryError, listMatches, getMatchDetail } from "../discovery/discovery.service.js";

/** Epic 7 — mutual connections. */
export async function matchesRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", app.authenticate);

  app.get("/matches", async (req) => ({ matches: await listMatches(req.user.sub) }));

  app.get("/matches/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    try {
      return { match: await getMatchDetail(req.user.sub, id) };
    } catch (err) {
      if (err instanceof DiscoveryError) return reply.status(err.status).send({ error: err.message });
      throw err;
    }
  });
}
