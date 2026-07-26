import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * Discovery preferences (Epic 6). Separate from Profile because these are
 * search controls, not identity — they filter who may be introduced.
 */
const preferencesSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },

    ageMin: { type: Number, default: 18, min: 18, max: 100 },
    ageMax: { type: Number, default: 60, min: 18, max: 100 },
    /** same = only my city · anywhere = no location filter */
    cityPreference: { type: String, enum: ["same", "anywhere"], default: "anywhere" },
    /** Intents the user is open to matching with; empty = any. */
    intents: {
      type: [String],
      enum: ["long-term", "slow-discovery", "open-to-either", "friendship-first"],
      default: [],
    },
    /** Pauses the daily introduction without deleting anything. */
    paused: { type: Boolean, default: false },

    /** Data visibility (Epic 9). */
    privacy: {
      type: new Schema(
        {
          showCity: { type: Boolean, default: true },
          showAge: { type: Boolean, default: true },
          allowVoicePlayback: { type: Boolean, default: true },
          readReceipts: { type: Boolean, default: true },
        },
        { _id: false },
      ),
      default: () => ({}),
    },
  },
  { timestamps: true },
);

export type PreferencesDoc = InferSchemaType<typeof preferencesSchema>;

export const Preferences = model("Preferences", preferencesSchema);

export const DEFAULT_PREFERENCES = {
  ageMin: 18,
  ageMax: 60,
  cityPreference: "anywhere" as const,
  intents: [] as string[],
  paused: false,
};

export async function getOrCreatePreferences(userId: string) {
  return (await Preferences.findOne({ userId })) ?? (await Preferences.create({ userId }));
}
