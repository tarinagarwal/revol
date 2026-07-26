import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * Core identity. Profile richness (personality, prompts, media) lives in
 * the Profile model (Epic 6) — this stays lean: credentials + account state.
 */
const otpSchema = new Schema(
  {
    codeHash: { type: String, required: true },
    purpose: { type: String, enum: ["verify-email", "reset-password"], required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, required: true, trim: true, maxlength: 60 },
    emailVerified: { type: Boolean, default: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    otp: { type: otpSchema, default: null },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: import("mongoose").Types.ObjectId };

export const User = model("User", userSchema);
