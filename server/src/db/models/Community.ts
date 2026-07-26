import { Schema, model, type InferSchemaType } from "mongoose";

export const COMMUNITY_TOPICS = [
  "music",
  "film",
  "books",
  "food",
  "fitness",
  "travel",
  "art",
  "tech",
  "outdoors",
  "nightlife",
  "wellness",
  "games",
] as const;

/** A shared-interest space (Epic 10). Groups hold members and host events. */
const communitySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    topic: { type: String, enum: COMMUNITY_TOPICS, required: true },
    city: { type: String, trim: true, maxlength: 80, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    /** Denormalised for fast browse listings; recomputed on join/leave. */
    memberCount: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "archived"], default: "active", index: true },
  },
  { timestamps: true },
);

communitySchema.index({ topic: 1, status: 1 });
communitySchema.index({ name: "text", description: "text" });

export type CommunityDoc = InferSchemaType<typeof communitySchema>;
export const Community = model("Community", communitySchema);

/* ---------- membership ---------- */

const memberSchema = new Schema(
  {
    communityId: { type: Schema.Types.ObjectId, ref: "Community", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, enum: ["member", "host"], default: "member" },
  },
  { timestamps: true },
);

memberSchema.index({ communityId: 1, userId: 1 }, { unique: true });

export type CommunityMemberDoc = InferSchemaType<typeof memberSchema>;
export const CommunityMember = model("CommunityMember", memberSchema);
