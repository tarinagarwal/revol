import "dotenv/config";
import { z } from "zod";

/**
 * Zod-validated environment. Fails fast on missing required values in
 * production; development tolerates unset integrations so the server
 * always boots for local work.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(8080),

  /** true = dev conveniences ON (OTPs logged + returned in API responses). NEVER true in prod. */
  DEV_MODE: z
    .string()
    .default("false")
    .transform((v) => v === "true"),

  MONGODB_URI: z.string().optional(),

  JWT_ACCESS_SECRET: z.string().optional(),
  JWT_REFRESH_SECRET: z.string().optional(),

  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  REDIS_URL: z.string().optional(),

  UPSTASH_VECTOR_REST_URL: z.string().optional(),
  UPSTASH_VECTOR_REST_TOKEN: z.string().optional(),

  QSTASH_URL: z.string().optional(),
  QSTASH_TOKEN: z.string().optional(),
  QSTASH_CURRENT_SIGNING_KEY: z.string().optional(),
  QSTASH_NEXT_SIGNING_KEY: z.string().optional(),

  OPENROUTER_API_KEY: z.string().optional(),

  GMAIL_USER: z.string().optional(),
  GMAIL_APP_PASSWORD: z.string().optional(),

  GCP_PROJECT_ID: z.string().optional(),
  GCS_BUCKET: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),

  PUBLIC_BASE_URL: z.string().default("http://localhost:8080"),
});

export const env = envSchema.parse(process.env);

export const isProd = env.NODE_ENV === "production";
