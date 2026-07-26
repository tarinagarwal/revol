import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * A mutual connection (Epic 7). Created the moment both sides like.
 * revealLevel is SHARED between the pair:
 *   3 veiled → 2 at mutual match → 1/0 earned through conversation (Epic 8).
 */
const matchSchema = new Schema(
  {
    /** Sorted pair [lowerId, higherId] — one doc per couple, ever. */
    users: {
      type: [Schema.Types.ObjectId],
      required: true,
      validate: (v: unknown[]) => v.length === 2,
    },
    pairKey: { type: String, required: true, unique: true, index: true },

    revealLevel: { type: Number, min: 0, max: 3, default: 2 },
    compatibility: {
      score: { type: Number, required: true },
      vibe: { type: String, required: true },
      reasons: { type: [String], default: [] },
      friction: { type: String, default: "" },
    },

    status: { type: String, enum: ["active", "unmatched"], default: "active", index: true },
    matchedAt: { type: Date, default: Date.now },
    /** Epic 8 fills these as conversation earns the reveal. */
    messageCount: { type: Number, default: 0 },
    lastMessageAt: { type: Date, default: null },
    /** Latest AI conversation-quality read (0-100) — drives reveal unlocks. */
    qualityScore: { type: Number, default: 0 },
  },
  { timestamps: true },
);

matchSchema.index({ users: 1, status: 1 });

export function pairKeyFor(a: string, b: string): string {
  return [a, b].sort().join(":");
}

export type MatchDoc = InferSchemaType<typeof matchSchema>;

export const Match = model("Match", matchSchema);
