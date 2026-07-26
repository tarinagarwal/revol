import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * Depth-first profile (Epic 3). The substance behind the mystery —
 * everything AI matching reads lives here, not on User.
 */
const promptAnswerSchema = new Schema(
  {
    promptId: { type: String, required: true },
    question: { type: String, required: true },
    answer: { type: String, required: true, maxlength: 240 },
  },
  { _id: false },
);

const voiceIntroSchema = new Schema(
  {
    objectPath: { type: String, required: true },
    mimeType: { type: String, required: true },
    durationSec: { type: Number, default: 0 },
    /** Filled by AI transcription in Epic 5. */
    transcript: { type: String, default: null },
  },
  { _id: false },
);

const profileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },

    basics: {
      type: new Schema(
        {
          birthdate: { type: Date, required: true },
          gender: { type: String, enum: ["woman", "man", "nonbinary", "other"], required: true },
          interestedIn: {
            type: [String],
            enum: ["women", "men", "nonbinary", "everyone"],
            required: true,
          },
          city: { type: String, required: true, trim: true, maxlength: 80 },
        },
        { _id: false },
      ),
      default: null,
    },

    intent: {
      type: String,
      enum: ["long-term", "slow-discovery", "open-to-either", "friendship-first"],
      default: null,
    },

    /** questionId → 1..5 */
    personality: { type: Map, of: Number, default: undefined },

    values: { type: [String], default: undefined },
    interests: { type: [String], default: undefined },
    prompts: { type: [promptAnswerSchema], default: undefined },
    voiceIntro: { type: voiceIntroSchema, default: null },

    onboarding: {
      step: { type: Number, default: 0 },
      completed: { type: Boolean, default: false },
      completedAt: { type: Date, default: null },
    },

    /** Set when the profile text is upserted into Upstash Vector. */
    vectorSyncedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type ProfileDoc = InferSchemaType<typeof profileSchema>;

export const Profile = model("Profile", profileSchema);
