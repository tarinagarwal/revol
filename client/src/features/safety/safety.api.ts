import { api, apiForm } from "@/lib/api";

export type ReportReason =
  | "harassment"
  | "inappropriate-content"
  | "fake-profile"
  | "underage"
  | "spam-or-scam"
  | "off-platform-pressure"
  | "other";

export const REPORT_LABELS: Record<ReportReason, string> = {
  harassment: "Harassment or abuse",
  "inappropriate-content": "Inappropriate content",
  "fake-profile": "Fake or stolen profile",
  underage: "They appear to be a minor",
  "spam-or-scam": "Spam or a scam",
  "off-platform-pressure": "Pressuring me off Revol",
  other: "Something else",
};

export const submitReport = (input: {
  reportedUserId: string;
  reason: ReportReason;
  details?: string;
  matchId?: string;
  alsoBlock: boolean;
}) => api<{ reportId: string; blocked: boolean }>("/safety/report", { method: "POST", body: JSON.stringify(input) });

export const blockUser = (userId: string) =>
  api<{ ok: boolean }>("/safety/block", { method: "POST", body: JSON.stringify({ userId }) });

export const unblockUser = (userId: string) => api<{ ok: boolean }>(`/safety/block/${userId}`, { method: "DELETE" });

export const getBlocks = () =>
  api<{ blocks: { id: string; userId: string; displayName: string; blockedAt: string }[] }>("/safety/blocks");

export const unmatch = (matchId: string) => api<{ ok: boolean }>(`/matches/${matchId}/unmatch`, { method: "POST" });

/* ---------- verification ---------- */

export type VerificationStatus = {
  status: "unverified" | "pending" | "verified" | "rejected";
  attempts: number;
  attemptsLeft: number;
  reason: string | null;
  verifiedAt: string | null;
};

export const getVerificationStatus = () => api<VerificationStatus>("/verification/status");

export const submitSelfie = (blob: Blob) => {
  const form = new FormData();
  form.append("file", blob, "selfie.jpg");
  return apiForm<{ status: string; reason: string | null; attemptsLeft: number }>("/verification/selfie", form);
};

/* ---------- privacy ---------- */

export type PrivacySettings = {
  showCity: boolean;
  showAge: boolean;
  allowVoicePlayback: boolean;
  readReceipts: boolean;
};

export const getPrivacySettings = () => api<{ privacy: PrivacySettings }>("/privacy/settings");

export const updatePrivacySettings = (patch: Partial<PrivacySettings>) =>
  api<{ privacy: PrivacySettings }>("/privacy/settings", { method: "PUT", body: JSON.stringify(patch) });

export const deleteAccount = (password: string) =>
  api<{ ok: boolean }>("/privacy/account", { method: "DELETE", body: JSON.stringify({ password }) });
