import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * A one-way block (Epic 9). Enforced symmetrically everywhere: a block in
 * either direction removes the pair from discovery and closes any match.
 */
const blockSchema = new Schema(
  {
    blockerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    blockedId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true },
);

blockSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });

export type BlockDoc = InferSchemaType<typeof blockSchema>;

export const Block = model("Block", blockSchema);

/** Everyone this user must never see again, in either direction. */
export async function blockedUserIds(userId: string): Promise<string[]> {
  const rows = await Block.find({ $or: [{ blockerId: userId }, { blockedId: userId }] });
  return rows.map((b) => (String(b.blockerId) === userId ? String(b.blockedId) : String(b.blockerId)));
}
