import { z } from "zod";
import { env } from "../config/env.js";

/**
 * AIService — the single gateway to OpenRouter (text · vision · voice).
 * Keys never leave the server. Prompt templates live in ./prompts/.
 * Every structured capability parses through Zod with one retry.
 * (Embeddings are NOT here — Upstash Vector's hosted BGE_M3 handles them.)
 */
const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "input_audio"; input_audio: { data: string; format: string } };

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string | ContentPart[];
};

type ChatOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
};

async function chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<string> {
  if (!env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not configured");

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://revol-dating.vercel.app",
      "X-Title": "Revol",
    },
    body: JSON.stringify({
      model: opts.model ?? env.AI_TEXT_MODEL,
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 1024,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenRouter ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  const content = data.choices[0]?.message.content;
  if (content === undefined || content === null) throw new Error("OpenRouter returned no content");
  return content;
}

/** Strips markdown fences some models wrap around JSON. */
function extractJson(raw: string): string {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(raw);
  const body = fenced?.[1] ?? raw;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  return start >= 0 && end > start ? body.slice(start, end + 1) : body;
}

/** JSON-mode chat parsed against a Zod schema, one retry on mismatch. */
async function chatJSON<T>(messages: ChatMessage[], schema: z.ZodType<T>, opts: ChatOptions = {}): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await chat(messages, { ...opts, json: true, temperature: attempt === 0 ? (opts.temperature ?? 0.6) : 0.2 });
    try {
      return schema.parse(JSON.parse(extractJson(raw)));
    } catch (err) {
      if (attempt === 1) throw new Error(`AI JSON parse failed: ${(err as Error).message}`);
    }
  }
  throw new Error("unreachable");
}

export const AIService = { chat, chatJSON };
