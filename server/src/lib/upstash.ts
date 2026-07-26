import { Redis } from "@upstash/redis";
import { Index } from "@upstash/vector";
import { Client as QStashClient } from "@upstash/qstash";
import { Ratelimit } from "@upstash/ratelimit";
import { env } from "../config/env.js";

/**
 * Upstash clients — lazy singletons. Provisioned resources:
 *   Redis  : revol-redis  (global, us-east-1)
 *   Vector : revol-vector (BGE_M3 hosted embeddings, 1024-dim, COSINE)
 *   QStash : eu-central-1 endpoint (QSTASH_URL required)
 */
let redis: Redis | null = null;
let vector: Index | null = null;
let qstash: QStashClient | null = null;
let aiRatelimit: Ratelimit | null = null;

export function getRedis(): Redis {
  if (!redis) {
    if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error("Upstash Redis env not configured");
    }
    redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

export function getVector(): Index {
  if (!vector) {
    if (!env.UPSTASH_VECTOR_REST_URL || !env.UPSTASH_VECTOR_REST_TOKEN) {
      throw new Error("Upstash Vector env not configured");
    }
    vector = new Index({
      url: env.UPSTASH_VECTOR_REST_URL,
      token: env.UPSTASH_VECTOR_REST_TOKEN,
    });
  }
  return vector;
}

export function getQStash(): QStashClient {
  if (!qstash) {
    if (!env.QSTASH_TOKEN) {
      throw new Error("QStash env not configured");
    }
    qstash = new QStashClient({
      token: env.QSTASH_TOKEN,
      ...(env.QSTASH_URL ? { baseUrl: env.QSTASH_URL } : {}),
    });
  }
  return qstash;
}

/** Per-user AI cost guardrail (Epic 5 tunes limits per feature). */
export function getAiRatelimit(): Ratelimit {
  if (!aiRatelimit) {
    aiRatelimit = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(30, "1 h"),
      prefix: "rl:ai",
    });
  }
  return aiRatelimit;
}
