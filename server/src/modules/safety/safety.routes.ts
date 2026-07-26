import type { FastifyInstance } from "fastify";
import { Types } from "mongoose";
import { z } from "zod";
import { Block } from "../../db/models/Block.js";
import { Match } from "../../db/models/Match.js";
import { Message } from "../../db/models/Message.js";
import { REPORT_REASONS, Report } from "../../db/models/Report.js";
import { User } from "../../db/models/User.js";

const reportSchema = z.object({
  reportedUserId: z.string().refine(Types.ObjectId.isValid, "Invalid user"),
  reason: z.enum(REPORT_REASONS),
  details: z.string().trim().max(1000).optional(),
  matchId: z.string().optional(),
  /** Blocking is the default when reporting — safety first, always. */
  alsoBlock: z.boolean().default(true),
});

/** Closes every shared match so neither person can reach the other again. */
async function severConnections(a: string, b: string): Promise<void> {
  await Match.updateMany({ users: { $all: [a, b] } }, { status: "unmatched" });
}

/** Epic 9 — report, block, unmatch, and the moderation queue. */
export async function safetyRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", app.authenticate);

  app.get("/safety/report-reasons", async () => ({ reasons: REPORT_REASONS }));

  app.post("/safety/report", async (req, reply) => {
    const parsed = reportSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.issues[0]?.message ?? "Invalid report" });
    const { reportedUserId, reason, details, matchId, alsoBlock } = parsed.data;
    if (reportedUserId === req.user.sub) return reply.status(400).send({ error: "You cannot report yourself" });

    const reported = await User.findById(reportedUserId);
    if (!reported) return reply.status(404).send({ error: "Person not found" });

    // Capture the conversation before a block hides it from moderators.
    let context: string[] = [];
    if (matchId && Types.ObjectId.isValid(matchId)) {
      const messages = await Message.find({ matchId }).sort({ _id: -1 }).limit(20);
      context = messages
        .reverse()
        .map((m) => `${String(m.senderId) === req.user.sub ? "reporter" : "reported"}: ${m.kind === "voice" ? "[voice note]" : m.body}`);
    }

    const report = await Report.create({
      reporterId: req.user.sub,
      reportedId: reportedUserId,
      matchId: matchId && Types.ObjectId.isValid(matchId) ? matchId : null,
      reason,
      details: details ?? "",
      context,
    });

    if (alsoBlock) {
      await Block.findOneAndUpdate(
        { blockerId: req.user.sub, blockedId: reportedUserId },
        { blockerId: req.user.sub, blockedId: reportedUserId },
        { upsert: true },
      );
      await severConnections(req.user.sub, reportedUserId);
    }

    return reply.status(201).send({ reportId: String(report._id), blocked: alsoBlock });
  });

  app.post("/safety/block", async (req, reply) => {
    const parsed = z.object({ userId: z.string().refine(Types.ObjectId.isValid) }).safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Invalid user" });
    if (parsed.data.userId === req.user.sub) return reply.status(400).send({ error: "You cannot block yourself" });

    await Block.findOneAndUpdate(
      { blockerId: req.user.sub, blockedId: parsed.data.userId },
      { blockerId: req.user.sub, blockedId: parsed.data.userId },
      { upsert: true },
    );
    await severConnections(req.user.sub, parsed.data.userId);
    return { ok: true };
  });

  app.get("/safety/blocks", async (req) => {
    const blocks = await Block.find({ blockerId: req.user.sub }).sort({ createdAt: -1 });
    const rows = await Promise.all(
      blocks.map(async (b) => {
        const u = await User.findById(b.blockedId);
        return {
          id: String(b._id),
          userId: String(b.blockedId),
          displayName: u?.displayName ?? "Someone",
          blockedAt: (b.createdAt as Date).toISOString(),
        };
      }),
    );
    return { blocks: rows };
  });

  app.delete("/safety/block/:userId", async (req, reply) => {
    const { userId } = req.params as { userId: string };
    if (!Types.ObjectId.isValid(userId)) return reply.status(400).send({ error: "Invalid user" });
    await Block.deleteOne({ blockerId: req.user.sub, blockedId: userId });
    // Unblocking does not restore a severed match — that stays ended.
    return { ok: true };
  });

  app.post("/matches/:id/unmatch", async (req, reply) => {
    const { id } = req.params as { id: string };
    if (!Types.ObjectId.isValid(id)) return reply.status(404).send({ error: "Match not found" });
    const match = await Match.findOne({ _id: id, users: req.user.sub, status: "active" });
    if (!match) return reply.status(404).send({ error: "Match not found" });
    match.set("status", "unmatched");
    await match.save();
    return { ok: true };
  });

  /* ---------- moderation queue (admin only) ---------- */

  app.get("/moderation/reports", async (req, reply) => {
    if (req.user.role !== "admin") return reply.status(403).send({ error: "Admins only" });
    const { status = "open" } = req.query as { status?: string };
    const reports = await Report.find({ status }).sort({ createdAt: -1 }).limit(100);
    const rows = await Promise.all(
      reports.map(async (r) => {
        const [reporter, reported] = await Promise.all([User.findById(r.reporterId), User.findById(r.reportedId)]);
        return {
          id: String(r._id),
          reason: r.reason,
          details: r.details,
          context: r.context,
          status: r.status,
          createdAt: (r.createdAt as Date).toISOString(),
          reporter: { id: String(r.reporterId), displayName: reporter?.displayName ?? "?" },
          reported: { id: String(r.reportedId), displayName: reported?.displayName ?? "?" },
        };
      }),
    );
    return { reports: rows };
  });

  app.put("/moderation/reports/:id", async (req, reply) => {
    if (req.user.role !== "admin") return reply.status(403).send({ error: "Admins only" });
    const { id } = req.params as { id: string };
    const parsed = z
      .object({
        status: z.enum(["open", "reviewing", "actioned", "dismissed"]),
        resolution: z.string().max(500).optional(),
      })
      .safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Invalid update" });
    if (!Types.ObjectId.isValid(id)) return reply.status(404).send({ error: "Report not found" });

    const report = await Report.findById(id);
    if (!report) return reply.status(404).send({ error: "Report not found" });
    report.set("status", parsed.data.status);
    if (parsed.data.resolution) report.set("resolution", parsed.data.resolution);
    if (parsed.data.status === "actioned" || parsed.data.status === "dismissed") {
      report.set("resolvedAt", new Date());
    }
    await report.save();
    return { ok: true, status: report.status };
  });
}
