import { Receiver } from "@upstash/qstash";
import { env } from "../config/env.js";
import { getQStash } from "./upstash.js";

/**
 * Background jobs (Epic 5 / QStash).
 * Production (public HTTPS base): publish via QStash → signed callback to
 * /jobs/<name>. Local dev (localhost is unreachable to QStash): run the
 * handler inline off the request path.
 */
export type JobName = "photo-analyze" | "voice-transcribe" | "daily-matches";

type JobHandler = (payload: Record<string, unknown>) => Promise<void>;

const handlers = new Map<JobName, JobHandler>();

export function registerJobHandler(name: JobName, handler: JobHandler): void {
  handlers.set(name, handler);
}

export function getJobHandler(name: string): JobHandler | undefined {
  return handlers.get(name as JobName);
}

function qstashReachable(): boolean {
  return env.PUBLIC_BASE_URL.startsWith("https://") && !!env.QSTASH_TOKEN;
}

export async function enqueueJob(name: JobName, payload: Record<string, unknown>): Promise<void> {
  if (qstashReachable()) {
    await getQStash().publishJSON({
      url: `${env.PUBLIC_BASE_URL}/jobs/${name}`,
      body: payload,
      retries: 2,
    });
    return;
  }
  // Dev fallback — detached, never blocks the request.
  const handler = handlers.get(name);
  if (!handler) return;
  setImmediate(() => {
    handler(payload).catch((err) => console.warn(`[jobs] inline ${name} failed:`, (err as Error).message));
  });
}

let receiver: Receiver | null = null;

/** Verifies QStash signatures on /jobs/* callbacks. */
export function verifyJobSignature(signature: string | undefined, body: string): Promise<boolean> {
  if (!env.QSTASH_CURRENT_SIGNING_KEY || !env.QSTASH_NEXT_SIGNING_KEY || !signature) {
    return Promise.resolve(false);
  }
  receiver ??= new Receiver({
    currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
    nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
  });
  return receiver.verify({ signature, body }).catch(() => false);
}
