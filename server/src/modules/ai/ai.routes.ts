import type { FastifyInstance } from "fastify";
import { getAiRatelimit } from "../../lib/upstash.js";
import { compatibilityReport, icebreakers } from "./ai.service.js";

/**
 * Epic 5 — AI capabilities over HTTP (rate-limited per user).
 * Epic 6/7 will consume these internally for match cards + chat;
 * exposed now for the product and for smoke testing.
 */
export async function aiRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", app.authenticate);

  app.addHook("preHandler", async (req, reply) => {
    const { success } = await getAiRatelimit().limit(req.user.sub);
    if (!success) {
      await reply.status(429).send({ error: "AI limit reached — try again in a little while" });
    }
  });

  app.get("/ai/compatibility/:otherUserId", async (req, reply) => {
    const { otherUserId } = req.params as { otherUserId: string };
    try {
      const report = await compatibilityReport(req.user.sub, otherUserId);
      return { report };
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.get("/ai/icebreakers/:otherUserId", async (req, reply) => {
    const { otherUserId } = req.params as { otherUserId: string };
    try {
      return { icebreakers: await icebreakers(req.user.sub, otherUserId) };
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });
}
