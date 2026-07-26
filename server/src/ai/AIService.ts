import { env } from "../config/env.js";

/**
 * AIService — the single gateway to OpenRouter (text · vision · voice).
 * Keys never leave the server. Prompt templates live in ./prompts/.
 * Responses are Zod-parsed by callers. Epic 5 implements each capability:
 *   - compatibility reasoning + chemistry score
 *   - icebreakers / conversation starters
 *   - vision: photo understanding + authenticity signal
 *   - voice: transcription + tone analysis
 * (Embeddings are NOT here — Upstash Vector's hosted BGE_M3 handles them.)
 */
const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export class AIService {
  private apiKey: string;

  constructor() {
    if (!env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY not configured");
    }
    this.apiKey = env.OPENROUTER_API_KEY;
  }

  /** Low-level chat completion — building block for every AI feature. */
  async chat(model: string, messages: ChatMessage[]): Promise<string> {
    const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages }),
    });
    if (!res.ok) {
      throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
    };
    const content = data.choices[0]?.message.content;
    if (content === undefined) {
      throw new Error("OpenRouter returned no choices");
    }
    return content;
  }
}
