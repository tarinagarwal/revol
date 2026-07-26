import { Storage } from "@google-cloud/storage";
import { randomUUID } from "node:crypto";
import { env } from "../../config/env.js";

/**
 * Google Cloud Storage — the single media backend (Epic 4 contract).
 * Auth: ADC — gcloud creds locally, service account on Cloud Run.
 * Bucket is private; reads go through V4 signed URLs.
 */
let storage: Storage | null = null;

function getBucket() {
  if (!env.GCS_BUCKET) throw new Error("GCS_BUCKET not configured");
  storage ??= new Storage(env.GCP_PROJECT_ID ? { projectId: env.GCP_PROJECT_ID } : {});
  return storage.bucket(env.GCS_BUCKET);
}

export type MediaKind = "voice-intro" | "voice-note" | "photo";

const kindConfig: Record<MediaKind, { prefix: string; maxBytes: number; contentTypes: RegExp }> = {
  "voice-intro": { prefix: "voice-intros", maxBytes: 10 * 1024 * 1024, contentTypes: /^audio\// },
  "voice-note": { prefix: "voice-notes", maxBytes: 10 * 1024 * 1024, contentTypes: /^audio\// },
  photo: { prefix: "photos", maxBytes: 15 * 1024 * 1024, contentTypes: /^image\// },
};

export function validateMedia(kind: MediaKind, contentType: string, bytes: number): string | null {
  const cfg = kindConfig[kind];
  if (!cfg.contentTypes.test(contentType)) return `Invalid content type for ${kind}`;
  if (bytes > cfg.maxBytes) return `File too large (max ${Math.round(cfg.maxBytes / 1024 / 1024)}MB)`;
  return null;
}

/** Streams a buffer into the bucket; returns the object path. */
export async function uploadMedia(
  kind: MediaKind,
  userId: string,
  contentType: string,
  data: Buffer,
): Promise<string> {
  const err = validateMedia(kind, contentType, data.length);
  if (err) throw new Error(err);

  const ext = contentType.split("/")[1]?.split(";")[0] ?? "bin";
  const objectPath = `${kindConfig[kind].prefix}/${userId}/${randomUUID()}.${ext}`;
  await getBucket().file(objectPath).save(data, {
    contentType,
    resumable: false,
    metadata: { cacheControl: "private, max-age=0" },
  });
  return objectPath;
}

/** V4 signed read URL (default 1h). */
export async function signedReadUrl(objectPath: string, ttlMinutes = 60): Promise<string> {
  const [url] = await getBucket()
    .file(objectPath)
    .getSignedUrl({ version: "v4", action: "read", expires: Date.now() + ttlMinutes * 60_000 });
  return url;
}

export async function deleteMedia(objectPath: string): Promise<void> {
  await getBucket()
    .file(objectPath)
    .delete({ ignoreNotFound: true });
}
