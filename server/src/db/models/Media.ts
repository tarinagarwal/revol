import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * Media metadata — one doc per object in GCS (Epic 4).
 * AI analysis (Epic 5) fills `ai` asynchronously after upload.
 */
const mediaSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    kind: { type: String, enum: ["photo", "voice-intro", "voice-note"], required: true },
    objectPath: { type: String, required: true, unique: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    /** Photo ordering — 0 is the primary photo. */
    position: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "deleted"], default: "active", index: true },

    ai: {
      analyzed: { type: Boolean, default: false },
      isHuman: { type: Boolean, default: null },
      safe: { type: Boolean, default: null },
      quality: { type: Number, default: null }, // 0-10
      description: { type: String, default: null },
      flaggedReason: { type: String, default: null },
    },
  },
  { timestamps: true },
);

mediaSchema.index({ userId: 1, kind: 1, status: 1, position: 1 });

export type MediaDoc = InferSchemaType<typeof mediaSchema>;

export const Media = model("Media", mediaSchema);
