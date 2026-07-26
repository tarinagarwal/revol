import { Types } from "mongoose";
import { Match } from "../../db/models/Match.js";
import { Message } from "../../db/models/Message.js";
import { User } from "../../db/models/User.js";
import { Preferences } from "../../db/models/Preferences.js";
import { publish } from "../../lib/realtime.js";
import { signedReadUrl, uploadMedia, validateMedia } from "../../lib/storage/gcs.js";
import { enqueueJob } from "../../lib/jobs.js";
import { icebreakers, moderateMessage } from "../ai/ai.service.js";
import { evaluateReveal } from "./reveal.service.js";

export class ChatError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Guarantees the caller belongs to this match before anything else. */
async function requireMembership(userId: string, matchId: string) {
  if (!Types.ObjectId.isValid(matchId)) throw new ChatError(404, "Conversation not found");
  const match = await Match.findOne({ _id: matchId, users: userId, status: "active" });
  if (!match) throw new ChatError(404, "Conversation not found");
  return match;
}

export async function messageDto(m: InstanceType<typeof Message>, viewerId: string) {
  return {
    id: String(m._id),
    matchId: String(m.matchId),
    kind: m.kind,
    body: m.body,
    mine: String(m.senderId) === viewerId,
    isSystem: m.kind === "system",
    voiceUrl: m.objectPath ? await signedReadUrl(m.objectPath).catch(() => null) : null,
    durationSec: m.durationSec,
    readAt: m.readAt ? m.readAt.toISOString() : null,
    createdAt: (m.createdAt as Date).toISOString(),
  };
}

/** Newest-first page; the client reverses for display. */
export async function listMessages(userId: string, matchId: string, before?: string, limit = 40) {
  await requireMembership(userId, matchId);
  const query: Record<string, unknown> = { matchId };
  if (before && Types.ObjectId.isValid(before)) query._id = { $lt: new Types.ObjectId(before) };

  const docs = await Message.find(query).sort({ _id: -1 }).limit(Math.min(limit, 100));
  const messages = await Promise.all(docs.reverse().map((d) => messageDto(d, userId)));
  return { messages, hasMore: docs.length === Math.min(limit, 100) };
}

async function afterSend(match: InstanceType<typeof Match>, message: InstanceType<typeof Message>) {
  match.set("messageCount", (match.messageCount ?? 0) + 1);
  match.set("lastMessageAt", new Date());
  await match.save();

  const dto = await messageDto(message, "");
  publish(match.users.map(String), {
    type: "message",
    matchId: String(match._id),
    // `mine` is resolved per-recipient on the client using senderId.
    message: { ...dto, senderId: String(message.senderId) },
  });

  // Reveal re-evaluation is async — never blocks sending.
  void enqueueJob("evaluate-reveal", { matchId: String(match._id) }).catch(() => undefined);
  return dto;
}

export async function sendText(userId: string, matchId: string, body: string) {
  const match = await requireMembership(userId, matchId);
  const trimmed = body.trim();
  if (!trimmed) throw new ChatError(400, "Message is empty");
  if (trimmed.length > 4000) throw new ChatError(400, "Message too long");

  // Epic 9 — safety filter runs before anything is stored. Fails open.
  const verdict = await moderateMessage(trimmed);
  if (!verdict.allowed) {
    throw new ChatError(422, verdict.reason ?? "That message can't be sent — it may harm the person receiving it.");
  }

  const message = await Message.create({ matchId, senderId: userId, kind: "text", body: trimmed });
  return afterSend(match, message);
}

export async function sendVoice(
  userId: string,
  matchId: string,
  buffer: Buffer,
  mimeType: string,
  durationSec: number,
) {
  const match = await requireMembership(userId, matchId);
  const invalid = validateMedia("voice-note", mimeType, buffer.length);
  if (invalid) throw new ChatError(400, invalid);

  const objectPath = await uploadMedia("voice-note", userId, mimeType, buffer);
  const message = await Message.create({
    matchId,
    senderId: userId,
    kind: "voice",
    objectPath,
    mimeType,
    durationSec,
  });
  // Transcribe so voice notes count toward conversation depth too.
  void enqueueJob("transcribe-voice-note", { messageId: String(message._id) }).catch(() => undefined);
  return afterSend(match, message);
}

export async function markRead(userId: string, matchId: string) {
  const match = await requireMembership(userId, matchId);
  const at = new Date();
  await Message.updateMany({ matchId, senderId: { $ne: userId }, readAt: null }, { readAt: at });

  // Read receipts are opt-out (Epic 9): if the reader disabled them, the
  // sender isn't told — the messages are still marked read for the reader.
  const prefs = await Preferences.findOne({ userId });
  if (prefs?.privacy?.readReceipts ?? true) {
    publish(
      match.users.map(String).filter((u) => u !== userId),
      { type: "read", matchId, userId, at: at.toISOString() },
    );
  }
  return { ok: true };
}

export async function sendTyping(userId: string, matchId: string) {
  const match = await requireMembership(userId, matchId);
  publish(
    match.users.map(String).filter((u) => u !== userId),
    { type: "typing", matchId, userId },
  );
  return { ok: true };
}

/** Conversation list — one row per mutual match, newest activity first. */
export async function listConversations(userId: string) {
  const matches = await Match.find({ users: userId, status: "active" }).sort({ lastMessageAt: -1, matchedAt: -1 });
  return Promise.all(
    matches.map(async (m) => {
      const otherId = m.users.map(String).find((u) => u !== userId) ?? "";
      const [other, last, unread] = await Promise.all([
        User.findById(otherId),
        Message.findOne({ matchId: m._id }).sort({ _id: -1 }),
        Message.countDocuments({ matchId: m._id, senderId: { $ne: userId }, readAt: null }),
      ]);
      const revealed = (m.revealLevel ?? 2) === 0;
      return {
        matchId: String(m._id),
        // Opaque id so the client can report/block without knowing who they are.
        userId: otherId,
        revealLevel: m.revealLevel ?? 2,
        verified: other?.verified ?? false,
        displayName: revealed ? (other?.displayName ?? null) : null,
        firstInitial: (other?.displayName ?? "?").charAt(0).toUpperCase(),
        chemistry: m.compatibility?.score ?? 0,
        vibe: m.compatibility?.vibe ?? "",
        lastMessage: last ? (last.kind === "voice" ? "Voice note" : last.body.slice(0, 80)) : null,
        lastMessageAt: last ? (last.createdAt as Date).toISOString() : null,
        unread,
      };
    }),
  );
}

/** AI openers grounded in both profiles — offered when a chat is still empty. */
export async function conversationIcebreakers(userId: string, matchId: string) {
  const match = await requireMembership(userId, matchId);
  const otherId = match.users.map(String).find((u) => u !== userId);
  if (!otherId) throw new ChatError(404, "Conversation not found");
  return icebreakers(userId, otherId);
}

export { evaluateReveal };
