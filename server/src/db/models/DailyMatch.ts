import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * One curated suggestion per user per day (Epic 6) — the anticipation engine.
 * Reveal state lives here; Epic 7's conversation-quality rules raise it.
 * revealLevel: 3 = fully veiled … 0 = revealed.
 */
const dailyMatchSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    candidateUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    /** YYYY-MM-DD in UTC — pacing key. */
    day: { type: String, required: true },

    compatibility: {
      score: { type: Number, required: true },
      vibe: { type: String, required: true },
      reasons: { type: [String], required: true },
      friction: { type: String, default: "" },
    },
    similarity: { type: Number, default: 0 },

    revealLevel: { type: Number, min: 0, max: 3, default: 3 },
    status: { type: String, enum: ["pending", "liked", "passed"], default: "pending", index: true },
    actedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

dailyMatchSchema.index({ userId: 1, day: 1 }, { unique: true });
dailyMatchSchema.index({ userId: 1, candidateUserId: 1 });

export type DailyMatchDoc = InferSchemaType<typeof dailyMatchSchema>;

export const DailyMatch = model("DailyMatch", dailyMatchSchema);
