import type { FastifyInstance } from "fastify";
import { Types } from "mongoose";
import { z } from "zod";
import { Device, Notification } from "../../db/models/Notification.js";
import { getOrCreatePreferences } from "../../db/models/Preferences.js";

const prefsSchema = z.object({
  matches: z.boolean().optional(),
  messages: z.boolean().optional(),
  reveals: z.boolean().optional(),
  events: z.boolean().optional(),
});

/** Epic 12 — notification centre, preferences, and device registration. */
export async function notificationRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", app.authenticate);

  app.get("/notifications", async (req) => {
    const [items, unread] = await Promise.all([
      Notification.find({ userId: req.user.sub }).sort({ _id: -1 }).limit(50),
      Notification.countDocuments({ userId: req.user.sub, readAt: null }),
    ]);
    return {
      unread,
      notifications: items.map((n) => ({
        id: String(n._id),
        type: n.type,
        title: n.title,
        body: n.body,
        link: n.link,
        readAt: n.readAt ? n.readAt.toISOString() : null,
        createdAt: (n.createdAt as Date).toISOString(),
      })),
    };
  });

  app.post("/notifications/read", async (req) => {
    const parsed = z.object({ id: z.string().optional() }).safeParse(req.body ?? {});
    const filter: Record<string, unknown> = { userId: req.user.sub, readAt: null };
    if (parsed.success && parsed.data.id && Types.ObjectId.isValid(parsed.data.id)) {
      filter._id = parsed.data.id;
    }
    await Notification.updateMany(filter, { readAt: new Date() });
    return { ok: true };
  });

  app.get("/notifications/preferences", async (req) => {
    const p = await getOrCreatePreferences(req.user.sub);
    return {
      notifications: {
        matches: p.notifications?.matches ?? true,
        messages: p.notifications?.messages ?? true,
        reveals: p.notifications?.reveals ?? true,
        events: p.notifications?.events ?? true,
      },
    };
  });

  app.put("/notifications/preferences", async (req, reply) => {
    const parsed = prefsSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Invalid preferences" });
    const p = await getOrCreatePreferences(req.user.sub);
    p.set("notifications", { ...(p.notifications ?? {}), ...parsed.data });
    await p.save();
    return {
      notifications: {
        matches: p.notifications?.matches ?? true,
        messages: p.notifications?.messages ?? true,
        reveals: p.notifications?.reveals ?? true,
        events: p.notifications?.events ?? true,
      },
    };
  });

  /** Native push registration (FCM/APNs token from Capacitor). */
  app.post("/notifications/devices", async (req, reply) => {
    const parsed = z
      .object({ token: z.string().min(10).max(500), platform: z.enum(["android", "ios", "web"]) })
      .safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Invalid device" });

    await Device.findOneAndUpdate(
      { token: parsed.data.token },
      { userId: req.user.sub, token: parsed.data.token, platform: parsed.data.platform, lastSeenAt: new Date() },
      { upsert: true },
    );
    return { ok: true };
  });

  app.delete("/notifications/devices/:token", async (req) => {
    const { token } = req.params as { token: string };
    await Device.deleteOne({ token, userId: req.user.sub });
    return { ok: true };
  });
}
