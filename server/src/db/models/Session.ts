import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * One doc per live refresh token (multi-device). Rotation swaps the jti;
 * logout deletes the doc; TTL index reaps expired sessions automatically.
 */
const sessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    jtiHash: { type: String, required: true, unique: true, index: true },
    userAgent: { type: String, default: "" },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// MongoDB TTL — session docs vanish when the refresh token expires.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type SessionDoc = InferSchemaType<typeof sessionSchema>;

export const Session = model("Session", sessionSchema);
