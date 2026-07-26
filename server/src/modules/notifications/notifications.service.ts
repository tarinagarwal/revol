import { Notification, type NOTIFICATION_TYPES } from "../../db/models/Notification.js";
import { Preferences } from "../../db/models/Preferences.js";
import { publish } from "../../lib/realtime.js";

type NotificationInput = {
  type: (typeof NOTIFICATION_TYPES)[number];
  title: string;
  body?: string;
  link?: string;
};

/** Per-type mute switches live in Preferences.notifications. */
function isMuted(prefs: { notifications?: Record<string, boolean> } | null, type: string): boolean {
  const n = prefs?.notifications;
  if (!n) return false;
  const key = `${type}s` as keyof typeof n; // match -> matches, message -> messages
  return n[key] === false;
}

/**
 * Creates notifications and pushes them live (Epic 12). Never throws — a
 * notification failure must not break the action that triggered it.
 */
export async function notify(userIds: string[], input: NotificationInput): Promise<void> {
  const recipients = [...new Set(userIds)].filter(Boolean);
  if (recipients.length === 0) return;

  try {
    const prefs = await Preferences.find({ userId: { $in: recipients } });
    const prefsByUser = new Map(prefs.map((p) => [String(p.userId), p]));

    const allowed = recipients.filter((id) => !isMuted(prefsByUser.get(id) ?? null, input.type));
    if (allowed.length === 0) return;

    const docs = await Notification.insertMany(
      allowed.map((userId) => ({
        userId,
        type: input.type,
        title: input.title,
        body: input.body ?? "",
        link: input.link ?? "",
      })),
    );

    for (const doc of docs) {
      publish([String(doc.userId)], {
        type: "notification",
        notification: {
          id: String(doc._id),
          type: doc.type,
          title: doc.title,
          body: doc.body,
          link: doc.link,
          createdAt: (doc.createdAt as Date).toISOString(),
        },
      });
    }
  } catch (err) {
    console.warn("[notify] failed:", (err as Error).message);
  }
}
