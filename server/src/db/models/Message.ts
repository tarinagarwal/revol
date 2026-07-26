import { Schema, model, type InferSchemaType } from "mongoose";

/** A message in a mutual match's conversation (Epic 8). */
const messageSchema = new Schema(
  {
    matchId: { type: Schema.Types.ObjectId, ref: "Match", required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    kind: { type: String, enum: ["text", "voice", "system"], default: "text" },

    body: { type: String, default: "", maxlength: 4000 },
    /** Voice notes: GCS object + duration. */
    objectPath: { type: String, default: null },
    durationSec: { type: Number, default: 0 },
    transcript: { type: String, default: null },

    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

messageSchema.index({ matchId: 1, createdAt: -1 });

export type MessageDoc = InferSchemaType<typeof messageSchema>;

export const Message = model("Message", messageSchema);
