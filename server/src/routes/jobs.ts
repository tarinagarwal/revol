import type { FastifyInstance } from "fastify";
import { getJobHandler, verifyJobSignature } from "../lib/jobs.js";

/** QStash callback endpoints — signature-verified, never user-facing. */
export async function jobRoutes(app: FastifyInstance): Promise<void> {
  app.post("/jobs/:name", { config: { rawBody: true } }, async (req, reply) => {
    const { name } = req.params as { name: string };
    const handler = getJobHandler(name);
    if (!handler) return reply.status(404).send({ error: "Unknown job" });

    const signature = req.headers["upstash-signature"] as string | undefined;
    const rawBody = JSON.stringify(req.body ?? {});
    const valid = await verifyJobSignature(signature, rawBody);
    if (!valid) return reply.status(401).send({ error: "Invalid signature" });

    try {
      await handler((req.body ?? {}) as Record<string, unknown>);
      return { ok: true };
    } catch (err) {
      req.log.error({ err }, `job ${name} failed`);
      return reply.status(500).send({ error: "Job failed" }); // QStash retries
    }
  });
}
