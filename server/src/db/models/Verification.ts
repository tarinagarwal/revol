import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * Identity verification (Epic 9). A live selfie is compared against the
 * member's primary photo by the vision model; the selfie is never shown to
 * anyone and is deleted once a verdict is reached.
 */
const verificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified",
      index: true,
    },
    attempts: { type: Number, default: 0 },
    lastAttemptAt: { type: Date, default: null },
    verifiedAt: { type: Date, default: null },
    /** Why a rejection happened — shown to the member so they can retry well. */
    reason: { type: String, default: null },
    ai: {
      isLivePerson: { type: Boolean, default: null },
      matchesProfile: { type: Boolean, default: null },
      confidence: { type: Number, default: null },
    },
  },
  { timestamps: true },
);

export type VerificationDoc = InferSchemaType<typeof verificationSchema>;

export const Verification = model("Verification", verificationSchema);

export const MAX_VERIFICATION_ATTEMPTS = 5;
