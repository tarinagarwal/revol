/**
 * Dev utility: creates a mutual match between two accounts so the chat and
 * reveal flow can be exercised by hand. Uses the real AI chemistry engine —
 * nothing about the match is faked except the two "likes".
 *
 * Run: npx tsx scripts/seed-test-match.ts <emailA> <emailB>
 */
import { connectDb, disconnectDb } from "../src/db/connect.js";
import { User } from "../src/db/models/User.js";
import { Match, pairKeyFor } from "../src/db/models/Match.js";
import { DailyMatch } from "../src/db/models/DailyMatch.js";
import { Message } from "../src/db/models/Message.js";
import { compatibilityReport } from "../src/modules/ai/ai.service.js";

const [emailA, emailB] = process.argv.slice(2);

async function main() {
  if (!emailA || !emailB) throw new Error("usage: seed-test-match <emailA> <emailB>");
  await connectDb();

  const [a, b] = await Promise.all([User.findOne({ email: emailA }), User.findOne({ email: emailB })]);
  if (!a || !b) throw new Error(`account not found: ${!a ? emailA : emailB}`);
  const idA = String(a._id);
  const idB = String(b._id);
  const day = new Date().toISOString().slice(0, 10);

  console.log("Reading chemistry with the real AI engine...");
  const report = await compatibilityReport(idA, idB);
  console.log(`  score ${report.score} — "${report.vibe}"`);

  // Record the mutual interest so discovery state stays consistent.
  for (const [self, other] of [
    [idA, idB],
    [idB, idA],
  ]) {
    await DailyMatch.findOneAndUpdate(
      { userId: self, day },
      {
        userId: self,
        candidateUserId: other,
        day,
        compatibility: report,
        similarity: 1,
        revealLevel: 3,
        status: "liked",
        actedAt: new Date(),
      },
      { upsert: true },
    );
  }

  const pairKey = pairKeyFor(idA, idB);
  const existing = await Match.findOne({ pairKey });
  if (existing) {
    // Fresh slate so the reveal progression can be experienced from the start.
    await Message.deleteMany({ matchId: existing._id });
    existing.set({ revealLevel: 2, status: "active", compatibility: report, messageCount: 0, qualityScore: 0 });
    await existing.save();
    console.log(`Reset existing match ${String(existing._id)} to reveal level 2, conversation cleared.`);
  } else {
    const created = await Match.create({
      users: [idA, idB].sort(),
      pairKey,
      revealLevel: 2,
      compatibility: report,
    });
    console.log(`Created match ${String(created._id)} at reveal level 2.`);
  }

  console.log(`\n${a.displayName} <-> ${b.displayName} are now matched.`);
  await disconnectDb();
  process.exit(0);
}

main().catch((err) => {
  console.error("seed failed:", err);
  process.exit(1);
});
