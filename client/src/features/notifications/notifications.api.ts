import { api } from "@/lib/api";

export type AppNotification = {
  id: string;
  type: "match" | "message" | "reveal" | "event" | "system";
  title: string;
  body: string;
  link: string;
  readAt: string | null;
  createdAt: string;
};

export type NotificationPrefs = {
  matches: boolean;
  messages: boolean;
  reveals: boolean;
  events: boolean;
};

export const getNotifications = () =>
  api<{ unread: number; notifications: AppNotification[] }>("/notifications");

export const markNotificationsRead = (id?: string) =>
  api<{ ok: boolean }>("/notifications/read", { method: "POST", body: JSON.stringify(id ? { id } : {}) });

export const getNotificationPrefs = () => api<{ notifications: NotificationPrefs }>("/notifications/preferences");

export const updateNotificationPrefs = (patch: Partial<NotificationPrefs>) =>
  api<{ notifications: NotificationPrefs }>("/notifications/preferences", {
    method: "PUT",
    body: JSON.stringify(patch),
  });

export const registerDevice = (token: string, platform: "android" | "ios" | "web") =>
  api<{ ok: boolean }>("/notifications/devices", { method: "POST", body: JSON.stringify({ token, platform }) });
