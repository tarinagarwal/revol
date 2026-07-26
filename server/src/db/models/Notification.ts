import { Schema, model, type InferSchemaType } from "mongoose";

export const NOTIFICATION_TYPES = ["match", "message", "reveal", "event", "system"] as const;

/** In-app notification (Epic 12). Delivered live over SSE and stored for later. */
const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true, maxlength: 120 },
    body: { type: String, default: "", maxlength: 300 },
    /** In-app route to open when tapped. */
    link: { type: String, default: "" },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, createdAt: -1 });
// Notifications are ephemeral by nature — reap after 60 days.
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 86_400 });

export type NotificationDoc = InferSchemaType<typeof notificationSchema>;
export const Notification = model("Notification", notificationSchema);

/* ---------- push device registrations ---------- */

const deviceSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    token: { type: String, required: true, unique: true },
    platform: { type: String, enum: ["android", "ios", "web"], required: true },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export type DeviceDoc = InferSchemaType<typeof deviceSchema>;
export const Device = model("Device", deviceSchema);
