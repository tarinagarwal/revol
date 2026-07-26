import { EventEmitter } from "node:events";
import { Redis } from "ioredis";
import { env } from "../config/env.js";

/**
 * Realtime fanout (Epic 8) — Upstash Redis pub/sub across instances, plus a
 * local emitter that feeds each connected SSE stream. Redis is optional: with
 * one warm Cloud Run instance the local emitter alone is correct, so a Redis
 * outage degrades to single-instance delivery instead of breaking chat.
 */
export type RealtimeEvent =
  | { type: "message"; matchId: string; message: unknown }
  | { type: "typing"; matchId: string; userId: string }
  | { type: "read"; matchId: string; userId: string; at: string }
  | { type: "reveal"; matchId: string; revealLevel: number }
  | { type: "match"; matchId: string }
  | { type: "notification"; notification: Record<string, unknown> };

/** Envelope: which users should receive the event. */
type Envelope = { recipients: string[]; event: RealtimeEvent };

const CHANNEL = "revol:realtime";

const local = new EventEmitter();
local.setMaxListeners(0);

let publisher: Redis | null = null;
let subscriber: Redis | null = null;
let redisReady = false;

function initRedis(): void {
  if (publisher || !env.REDIS_URL) return;
  try {
    publisher = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 2, lazyConnect: false });
    subscriber = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 2, lazyConnect: false });
    publisher.on("error", (e: Error) => console.warn("[realtime] publisher:", e.message));
    subscriber.on("error", (e: Error) => console.warn("[realtime] subscriber:", e.message));
    subscriber.on("ready", () => {
      redisReady = true;
      console.log("[realtime] Redis pub/sub connected");
    });
    void subscriber.subscribe(CHANNEL);
    subscriber.on("message", (_channel: string, payload: string) => {
      try {
        const env_ = JSON.parse(payload) as Envelope & { origin: string };
        if (env_.origin === instanceId) return; // already delivered locally
        deliverLocal(env_);
      } catch {
        // Malformed payload — ignore.
      }
    });
  } catch (err) {
    console.warn("[realtime] Redis unavailable, using local fanout only:", (err as Error).message);
  }
}

const instanceId = `${process.pid}-${Math.floor(process.uptime() * 1000)}`;

function deliverLocal(envelope: Envelope): void {
  for (const userId of envelope.recipients) {
    local.emit(userId, envelope.event);
  }
}

/** Publishes an event to the given users on every instance. */
export function publish(recipients: string[], event: RealtimeEvent): void {
  const envelope: Envelope = { recipients, event };
  deliverLocal(envelope);
  initRedis();
  if (publisher && redisReady) {
    void publisher
      .publish(CHANNEL, JSON.stringify({ ...envelope, origin: instanceId }))
      .catch((e: Error) => console.warn("[realtime] publish failed:", e.message));
  }
}

/** Subscribes one connected client; returns an unsubscribe function. */
export function subscribeUser(userId: string, handler: (event: RealtimeEvent) => void): () => void {
  initRedis();
  local.on(userId, handler);
  return () => local.off(userId, handler);
}
