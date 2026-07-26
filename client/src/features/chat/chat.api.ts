import { api, apiForm } from "@/lib/api";

export type ChatMessage = {
  id: string;
  matchId: string;
  kind: "text" | "voice" | "system";
  body: string;
  mine: boolean;
  isSystem: boolean;
  voiceUrl: string | null;
  durationSec: number;
  readAt: string | null;
  createdAt: string;
  /** Present on realtime events so the client can resolve `mine`. */
  senderId?: string;
  /** Client-side only — optimistic/queued state. */
  pending?: boolean;
  failed?: boolean;
};

export type Conversation = {
  matchId: string;
  revealLevel: 0 | 1 | 2 | 3;
  displayName: string | null;
  firstInitial: string;
  chemistry: number;
  vibe: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unread: number;
};

export const getConversations = () => api<{ conversations: Conversation[] }>("/chat/conversations");

export const getMessages = (matchId: string, before?: string) =>
  api<{ messages: ChatMessage[]; hasMore: boolean }>(
    `/chat/${matchId}/messages${before ? `?before=${before}` : ""}`,
  );

export const sendMessage = (matchId: string, body: string) =>
  api<{ message: ChatMessage }>(`/chat/${matchId}/messages`, { method: "POST", body: JSON.stringify({ body }) });

export const sendVoiceNote = (matchId: string, blob: Blob, durationSec: number) => {
  const form = new FormData();
  form.append("durationSec", String(durationSec));
  form.append("file", blob, "voice-note.wav");
  return apiForm<{ message: ChatMessage }>(`/chat/${matchId}/voice`, form);
};

export const markConversationRead = (matchId: string) =>
  api<{ ok: boolean }>(`/chat/${matchId}/read`, { method: "POST" });

export const sendTypingSignal = (matchId: string) =>
  api<{ ok: boolean }>(`/chat/${matchId}/typing`, { method: "POST" });

export const getIcebreakers = (matchId: string) =>
  api<{ icebreakers: string[] }>(`/chat/${matchId}/icebreakers`);
