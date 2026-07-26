import { Schema, model, type InferSchemaType } from "mongoose";

export const REPORT_REASONS = [
  "harassment",
  "inappropriate-content",
  "fake-profile",
  "underage",
  "spam-or-scam",
  "off-platform-pressure",
  "other",
] as const;

/** A member report feeding the moderation queue (Epic 9). */
const reportSchema = new Schema(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reportedId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    matchId: { type: Schema.Types.ObjectId, ref: "Match", default: null },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    details: { type: String, default: "", maxlength: 1000 },
    /** Snapshot of recent messages so moderators see context after a block. */
    context: { type: [String], default: [] },

    status: { type: String, enum: ["open", "reviewing", "actioned", "dismissed"], default: "open", index: true },
    resolution: { type: String, default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

reportSchema.index({ status: 1, createdAt: -1 });

export type ReportDoc = InferSchemaType<typeof reportSchema>;

export const Report = model("Report", reportSchema);
