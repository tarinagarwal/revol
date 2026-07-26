import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { subscribeUser, type RealtimeEvent } from "../../lib/realtime.js";
import {
  ChatError,
  conversationIcebreakers,
  listConversations,
  listMessages,
  markRead,
  sendText,
  sendTyping,
  sendVoice,
} from "./chat.service.js";

function handle(err: unknown, reply: { status: (n: number) => { send: (b: unknown) => unknown } }) {
  if (err instanceof ChatError) return reply.status(err.status).send({ error: err.message });
  throw err;
}

export async function chatRoutes(app: FastifyInstance): Promise<void> {
  /* ---------- SSE stream (auth via query param: EventSource can't set headers) ---------- */
  app.get("/chat/stream", async (req: FastifyRequest, reply) => {
    const { token } = req.query as { token?: string };
    if (!token) return reply.status(401).send({ error: "Missing token" });

    let userId: string;
    try {
      const payload = app.jwt.verify<{ sub: string }>(token);
      userId = payload.sub;
    } catch {
      return reply.status(401).send({ error: "Invalid token" });
    }

    // Writing to reply.raw bypasses Fastify's onSend hooks, so @fastify/cors
    // never adds its headers — browsers would silently drop the stream.
    // hijack() takes ownership of the socket; CORS is set by hand.
    reply.hijack();
    const origin = req.headers.origin;
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      ...(origin
        ? {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            Vary: "Origin",
          }
        : {}),
    });
    reply.raw.write(`event: ready\ndata: {"ok":true}\n\n`);

    const send = (event: RealtimeEvent) => {
      reply.raw.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
    };
    const unsubscribe = subscribeUser(userId, send);

    // Keep-alive so proxies don't drop an idle connection.
    const ping = setInterval(() => reply.raw.write(`: ping\n\n`), 25_000);

    req.raw.on("close", () => {
      clearInterval(ping);
      unsubscribe();
      reply.raw.end();
    });
  });

  /* ---------- authenticated REST ---------- */
  app.register(async (secured) => {
    secured.addHook("preHandler", app.authenticate);

    secured.get("/chat/conversations", async (req) => ({ conversations: await listConversations(req.user.sub) }));

    secured.get("/chat/:matchId/messages", async (req, reply) => {
      const { matchId } = req.params as { matchId: string };
      const { before } = req.query as { before?: string };
      try {
        return await listMessages(req.user.sub, matchId, before);
      } catch (err) {
        return handle(err, reply);
      }
    });

    secured.post("/chat/:matchId/messages", async (req, reply) => {
      const { matchId } = req.params as { matchId: string };
      const parsed = z.object({ body: z.string().min(1).max(4000) }).safeParse(req.body);
      if (!parsed.success) return reply.status(400).send({ error: "Message is empty" });
      try {
        return { message: await sendText(req.user.sub, matchId, parsed.data.body) };
      } catch (err) {
        return handle(err, reply);
      }
    });

    secured.post("/chat/:matchId/voice", async (req, reply) => {
      const { matchId } = req.params as { matchId: string };
      const file = await req.file();
      if (!file) return reply.status(400).send({ error: "No audio file" });
      const buf = await file.toBuffer();
      const durationSec = Number((file.fields.durationSec as { value?: string } | undefined)?.value ?? 0);
      try {
        return { message: await sendVoice(req.user.sub, matchId, buf, file.mimetype, durationSec) };
      } catch (err) {
        return handle(err, reply);
      }
    });

    secured.post("/chat/:matchId/read", async (req, reply) => {
      const { matchId } = req.params as { matchId: string };
      try {
        return await markRead(req.user.sub, matchId);
      } catch (err) {
        return handle(err, reply);
      }
    });

    secured.post("/chat/:matchId/typing", async (req, reply) => {
      const { matchId } = req.params as { matchId: string };
      try {
        return await sendTyping(req.user.sub, matchId);
      } catch (err) {
        return handle(err, reply);
      }
    });

    secured.get("/chat/:matchId/icebreakers", async (req, reply) => {
      const { matchId } = req.params as { matchId: string };
      try {
        return { icebreakers: await conversationIcebreakers(req.user.sub, matchId) };
      } catch (err) {
        return handle(err, reply);
      }
    });
  });
}
