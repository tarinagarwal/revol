import { Match } from "../../db/models/Match.js";
import { Message } from "../../db/models/Message.js";
import { AIService } from "../../ai/AIService.js";
import {
  conversationQualityPrompt,
  conversationQualitySchema,
  conversationQualitySystem,
  type ConversationQuality,
} from "../../ai/prompts/conversation.js";
import { publish } from "../../lib/realtime.js";

/**
 * The reveal engine (Epic 7's unlock rules, powered by Epic 8's messages).
 * The blur lifts only when BOTH people have genuinely invested:
 *   level 2 → 1  a real exchange has started
 *   level 1 → 0  the conversation has real depth — faces revealed
 * Gates are structural (messages from each side) AND qualitative (AI read),
 * so volume alone can never buy a reveal.
 */
export const REVEAL_RULES = {
  toLevel1: { messagesEach: 4, minScore: 45 },
  toLevel0: { messagesEach: 12, minScore: 65 },
} as const;

function overall(q: ConversationQuality): number {
  // Mutuality weighted highest — one-sided effort must not unlock anything.
  return Math.round(q.depth * 0.35 + q.mutuality * 0.4 + q.warmth * 0.25);
}

async function scoreConversation(matchId: string): Promise<ConversationQuality | null> {
  const messages = await Message.find({ matchId, kind: { $ne: "system" } })
    .sort({ createdAt: 1 })
    .limit(80);
  if (messages.length === 0) return null;

  const first = String(messages[0]?.senderId ?? "");
  const transcript = messages
    .map((m) => {
      const who = String(m.senderId) === first ? "A" : "B";
      const text = m.kind === "voice" ? (m.transcript ?? "[voice note]") : m.body;
      return `${who}: ${text}`;
    })
    .join("\n");

  try {
    return await AIService.chatJSON(
      [
        { role: "system", content: conversationQualitySystem },
        { role: "user", content: conversationQualityPrompt(transcript) },
      ],
      conversationQualitySchema,
      { temperature: 0.2 },
    );
  } catch (err) {
    console.warn("[reveal] quality scoring failed:", (err as Error).message);
    return null;
  }
}

/**
 * Re-evaluates a match's reveal level. Cheap structural gate first; the AI
 * read only runs when the message thresholds are already met.
 */
export async function evaluateReveal(matchId: string): Promise<{ revealLevel: number; changed: boolean }> {
  const match = await Match.findById(matchId);
  if (!match || match.status !== "active") return { revealLevel: 3, changed: false };
  const current = match.revealLevel ?? 2;
  if (current === 0) return { revealLevel: 0, changed: false };

  const [userA, userB] = match.users.map(String);
  const [countA, countB] = await Promise.all([
    Message.countDocuments({ matchId, senderId: userA, kind: { $ne: "system" } }),
    Message.countDocuments({ matchId, senderId: userB, kind: { $ne: "system" } }),
  ]);
  const each = Math.min(countA, countB);

  const target = current === 2 ? REVEAL_RULES.toLevel1 : REVEAL_RULES.toLevel0;
  if (each < target.messagesEach) return { revealLevel: current, changed: false };

  const quality = await scoreConversation(matchId);
  if (!quality) return { revealLevel: current, changed: false };
  const score = overall(quality);

  match.set("qualityScore", score);
  if (score < target.minScore) {
    await match.save();
    return { revealLevel: current, changed: false };
  }

  const next = current - 1;
  match.set("revealLevel", next);
  await match.save();

  publish(match.users.map(String), { type: "reveal", matchId, revealLevel: next });
  await Message.create({
    matchId,
    senderId: userA, // system messages carry a sender for schema simplicity
    kind: "system",
    body:
      next === 0
        ? "The blur has lifted. You can see each other now."
        : "Something is building — the veil just thinned.",
  });

  console.log(`[reveal] match ${matchId}: ${current} → ${next} (score ${score})`);
  return { revealLevel: next, changed: true };
}
