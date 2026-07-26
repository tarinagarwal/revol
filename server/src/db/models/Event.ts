import { Schema, model, type InferSchemaType } from "mongoose";

/** A gathering hosted by a community (Epic 10). */
const eventSchema = new Schema(
  {
    communityId: { type: Schema.Types.ObjectId, ref: "Community", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 90 },
    description: { type: String, required: true, trim: true, maxlength: 800 },
    startsAt: { type: Date, required: true, index: true },
    /** Free text — venue or "online". Precise addresses only after RSVP. */
    location: { type: String, required: true, trim: true, maxlength: 140 },
    city: { type: String, trim: true, maxlength: 80, default: "" },
    /** 0 = unlimited. */
    capacity: { type: Number, default: 0, min: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    goingCount: { type: Number, default: 0 },
    status: { type: String, enum: ["scheduled", "cancelled"], default: "scheduled", index: true },
  },
  { timestamps: true },
);

eventSchema.index({ startsAt: 1, status: 1 });

export type EventDoc = InferSchemaType<typeof eventSchema>;
export const Event = model("Event", eventSchema);

/* ---------- RSVPs ---------- */

export const RSVP_STATUSES = ["going", "interested", "not-going"] as const;

const rsvpSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: RSVP_STATUSES, required: true },
  },
  { timestamps: true },
);

rsvpSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export type EventRsvpDoc = InferSchemaType<typeof rsvpSchema>;
export const EventRsvp = model("EventRsvp", rsvpSchema);
