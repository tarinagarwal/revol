import type { FastifyInstance } from "fastify";
import { Types } from "mongoose";
import { z } from "zod";
import { COMMUNITY_TOPICS, Community, CommunityMember } from "../../db/models/Community.js";
import { Event, EventRsvp, RSVP_STATUSES } from "../../db/models/Event.js";
import { User } from "../../db/models/User.js";
import { blockedUserIds } from "../../db/models/Block.js";
import { notify } from "../notifications/notifications.service.js";

const createCommunitySchema = z.object({
  name: z.string().trim().min(3).max(60),
  description: z.string().trim().min(10).max(500),
  topic: z.enum(COMMUNITY_TOPICS),
  city: z.string().trim().max(80).optional(),
});

const createEventSchema = z.object({
  title: z.string().trim().min(3).max(90),
  description: z.string().trim().min(10).max(800),
  startsAt: z.coerce.date().refine((d) => d.getTime() > Date.now(), "Events must be in the future"),
  location: z.string().trim().min(2).max(140),
  city: z.string().trim().max(80).optional(),
  capacity: z.number().int().min(0).max(1000).optional(),
});

function bad(reply: { status: (n: number) => { send: (b: unknown) => unknown } }, message: string) {
  return reply.status(400).send({ error: message });
}

async function requireCommunity(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return Community.findOne({ _id: id, status: "active" });
}

/** Epic 10 — communities, membership, events and RSVPs. */
export async function communityRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", app.authenticate);

  app.get("/communities/topics", async () => ({ topics: COMMUNITY_TOPICS }));

  /* ---------- browse + create ---------- */

  app.get("/communities", async (req) => {
    const { topic, q, mine } = req.query as { topic?: string; q?: string; mine?: string };
    const filter: Record<string, unknown> = { status: "active" };
    if (topic && COMMUNITY_TOPICS.includes(topic as (typeof COMMUNITY_TOPICS)[number])) filter.topic = topic;
    if (q) filter.name = { $regex: q.slice(0, 60), $options: "i" };

    if (mine === "true") {
      const memberships = await CommunityMember.find({ userId: req.user.sub });
      filter._id = { $in: memberships.map((m) => m.communityId) };
    }

    const communities = await Community.find(filter).sort({ memberCount: -1, createdAt: -1 }).limit(60);
    const myIds = new Set(
      (await CommunityMember.find({ userId: req.user.sub })).map((m) => String(m.communityId)),
    );

    return {
      communities: communities.map((c) => ({
        id: String(c._id),
        name: c.name,
        description: c.description,
        topic: c.topic,
        city: c.city,
        memberCount: c.memberCount,
        joined: myIds.has(String(c._id)),
      })),
    };
  });

  app.post("/communities", async (req, reply) => {
    const parsed = createCommunitySchema.safeParse(req.body);
    if (!parsed.success) return bad(reply, parsed.error.issues[0]?.message ?? "Invalid community");

    const community = await Community.create({
      ...parsed.data,
      createdBy: req.user.sub,
      memberCount: 1,
    });
    // The creator is automatically its first host.
    await CommunityMember.create({ communityId: community._id, userId: req.user.sub, role: "host" });

    return reply.status(201).send({ id: String(community._id) });
  });

  app.get("/communities/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const community = await requireCommunity(id);
    if (!community) return reply.status(404).send({ error: "Community not found" });

    const [membership, members, events] = await Promise.all([
      CommunityMember.findOne({ communityId: id, userId: req.user.sub }),
      CommunityMember.find({ communityId: id }).sort({ createdAt: 1 }).limit(50),
      Event.find({ communityId: id, status: "scheduled", startsAt: { $gte: new Date() } }).sort({ startsAt: 1 }),
    ]);

    // Blocked people are never listed back to you (Epic 9 carries through).
    const blocked = new Set(await blockedUserIds(req.user.sub));
    const memberRows = (
      await Promise.all(
        members
          .filter((m) => !blocked.has(String(m.userId)))
          .map(async (m) => {
            const u = await User.findById(m.userId);
            if (!u) return null;
            return {
              userId: String(m.userId),
              displayName: u.displayName,
              verified: u.verified ?? false,
              role: m.role,
            };
          }),
      )
    ).filter(Boolean);

    const rsvps = await EventRsvp.find({ eventId: { $in: events.map((e) => e._id) }, userId: req.user.sub });
    const rsvpByEvent = new Map(rsvps.map((r) => [String(r.eventId), r.status]));

    return {
      community: {
        id: String(community._id),
        name: community.name,
        description: community.description,
        topic: community.topic,
        city: community.city,
        memberCount: community.memberCount,
        joined: !!membership,
        isHost: membership?.role === "host",
        members: memberRows,
        events: events.map((e) => ({
          id: String(e._id),
          title: e.title,
          description: e.description,
          startsAt: e.startsAt.toISOString(),
          location: e.location,
          capacity: e.capacity,
          goingCount: e.goingCount,
          myRsvp: rsvpByEvent.get(String(e._id)) ?? null,
        })),
      },
    };
  });

  app.put("/communities/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const community = await requireCommunity(id);
    if (!community) return reply.status(404).send({ error: "Community not found" });
    const membership = await CommunityMember.findOne({ communityId: id, userId: req.user.sub, role: "host" });
    if (!membership) return reply.status(403).send({ error: "Only hosts can edit this community" });

    const parsed = createCommunitySchema.partial().safeParse(req.body);
    if (!parsed.success) return bad(reply, "Invalid update");
    community.set(parsed.data);
    await community.save();
    return { ok: true };
  });

  app.delete("/communities/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const community = await requireCommunity(id);
    if (!community) return reply.status(404).send({ error: "Community not found" });
    if (String(community.createdBy) !== req.user.sub) {
      return reply.status(403).send({ error: "Only the creator can archive this community" });
    }
    community.set("status", "archived");
    await community.save();
    await Event.updateMany({ communityId: id, status: "scheduled" }, { status: "cancelled" });
    return { ok: true };
  });

  /* ---------- membership ---------- */

  app.post("/communities/:id/join", async (req, reply) => {
    const { id } = req.params as { id: string };
    const community = await requireCommunity(id);
    if (!community) return reply.status(404).send({ error: "Community not found" });

    const existing = await CommunityMember.findOne({ communityId: id, userId: req.user.sub });
    if (existing) return { ok: true, alreadyMember: true };

    await CommunityMember.create({ communityId: id, userId: req.user.sub, role: "member" });
    community.set("memberCount", await CommunityMember.countDocuments({ communityId: id }));
    await community.save();
    return { ok: true, memberCount: community.memberCount };
  });

  app.delete("/communities/:id/leave", async (req, reply) => {
    const { id } = req.params as { id: string };
    const community = await requireCommunity(id);
    if (!community) return reply.status(404).send({ error: "Community not found" });

    // A community must never be left host-less.
    const membership = await CommunityMember.findOne({ communityId: id, userId: req.user.sub });
    if (membership?.role === "host") {
      const otherHosts = await CommunityMember.countDocuments({ communityId: id, role: "host", userId: { $ne: req.user.sub } });
      if (otherHosts === 0) {
        return bad(reply, "Promote another host before leaving, or archive the community");
      }
    }

    await CommunityMember.deleteOne({ communityId: id, userId: req.user.sub });
    community.set("memberCount", await CommunityMember.countDocuments({ communityId: id }));
    await community.save();
    return { ok: true, memberCount: community.memberCount };
  });

  /* ---------- events ---------- */

  app.post("/communities/:id/events", async (req, reply) => {
    const { id } = req.params as { id: string };
    const community = await requireCommunity(id);
    if (!community) return reply.status(404).send({ error: "Community not found" });
    const membership = await CommunityMember.findOne({ communityId: id, userId: req.user.sub });
    if (!membership) return reply.status(403).send({ error: "Join the community to host an event" });

    const parsed = createEventSchema.safeParse(req.body);
    if (!parsed.success) return bad(reply, parsed.error.issues[0]?.message ?? "Invalid event");

    const event = await Event.create({
      ...parsed.data,
      city: parsed.data.city ?? community.city,
      communityId: id,
      createdBy: req.user.sub,
    });

    // Tell the community something is happening (Epic 12).
    const members = await CommunityMember.find({ communityId: id, userId: { $ne: req.user.sub } });
    await notify(
      members.map((m) => String(m.userId)),
      {
        type: "event",
        title: `${community.name}: ${event.title}`,
        body: `${new Date(event.startsAt).toLocaleDateString()} · ${event.location}`,
        link: `/app/communities/${id}`,
      },
    );

    return reply.status(201).send({ id: String(event._id) });
  });

  /** Upcoming events across the member's communities, soonest first. */
  app.get("/events", async (req) => {
    const { scope } = req.query as { scope?: string };
    const memberships = await CommunityMember.find({ userId: req.user.sub });
    const myCommunityIds = memberships.map((m) => m.communityId);

    const filter: Record<string, unknown> = { status: "scheduled", startsAt: { $gte: new Date() } };
    if (scope !== "all") filter.communityId = { $in: myCommunityIds };

    const events = await Event.find(filter).sort({ startsAt: 1 }).limit(60);
    const rsvps = await EventRsvp.find({ eventId: { $in: events.map((e) => e._id) }, userId: req.user.sub });
    const rsvpByEvent = new Map(rsvps.map((r) => [String(r.eventId), r.status]));
    const communities = await Community.find({ _id: { $in: events.map((e) => e.communityId) } });
    const nameById = new Map(communities.map((c) => [String(c._id), c.name]));

    return {
      events: events.map((e) => ({
        id: String(e._id),
        communityId: String(e.communityId),
        communityName: nameById.get(String(e.communityId)) ?? "",
        title: e.title,
        description: e.description,
        startsAt: e.startsAt.toISOString(),
        location: e.location,
        capacity: e.capacity,
        goingCount: e.goingCount,
        myRsvp: rsvpByEvent.get(String(e._id)) ?? null,
      })),
    };
  });

  app.get("/events/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    if (!Types.ObjectId.isValid(id)) return reply.status(404).send({ error: "Event not found" });
    const event = await Event.findById(id);
    if (!event) return reply.status(404).send({ error: "Event not found" });

    const [community, myRsvp, attendees] = await Promise.all([
      Community.findById(event.communityId),
      EventRsvp.findOne({ eventId: id, userId: req.user.sub }),
      EventRsvp.find({ eventId: id, status: "going" }).limit(50),
    ]);

    const blocked = new Set(await blockedUserIds(req.user.sub));
    const attendeeRows = (
      await Promise.all(
        attendees
          .filter((a) => !blocked.has(String(a.userId)))
          .map(async (a) => {
            const u = await User.findById(a.userId);
            return u ? { userId: String(a.userId), displayName: u.displayName, verified: u.verified ?? false } : null;
          }),
      )
    ).filter(Boolean);

    return {
      event: {
        id: String(event._id),
        communityId: String(event.communityId),
        communityName: community?.name ?? "",
        title: event.title,
        description: event.description,
        startsAt: event.startsAt.toISOString(),
        location: event.location,
        capacity: event.capacity,
        goingCount: event.goingCount,
        status: event.status,
        isHost: String(event.createdBy) === req.user.sub,
        myRsvp: myRsvp?.status ?? null,
        attendees: attendeeRows,
      },
    };
  });

  app.post("/events/:id/rsvp", async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = z.object({ status: z.enum(RSVP_STATUSES) }).safeParse(req.body);
    if (!parsed.success) return bad(reply, "Invalid RSVP");
    if (!Types.ObjectId.isValid(id)) return reply.status(404).send({ error: "Event not found" });

    const event = await Event.findById(id);
    if (!event || event.status !== "scheduled") return reply.status(404).send({ error: "Event not found" });
    if (event.startsAt.getTime() < Date.now()) return bad(reply, "This event has already happened");

    const previous = await EventRsvp.findOne({ eventId: id, userId: req.user.sub });
    // Capacity is only enforced for people newly going.
    if (
      parsed.data.status === "going" &&
      previous?.status !== "going" &&
      event.capacity > 0 &&
      event.goingCount >= event.capacity
    ) {
      return bad(reply, "This event is full");
    }

    await EventRsvp.findOneAndUpdate(
      { eventId: id, userId: req.user.sub },
      { eventId: id, userId: req.user.sub, status: parsed.data.status },
      { upsert: true },
    );
    event.set("goingCount", await EventRsvp.countDocuments({ eventId: id, status: "going" }));
    await event.save();

    return { ok: true, status: parsed.data.status, goingCount: event.goingCount };
  });

  app.delete("/events/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    if (!Types.ObjectId.isValid(id)) return reply.status(404).send({ error: "Event not found" });
    const event = await Event.findById(id);
    if (!event) return reply.status(404).send({ error: "Event not found" });
    if (String(event.createdBy) !== req.user.sub) {
      return reply.status(403).send({ error: "Only the host can cancel this event" });
    }
    event.set("status", "cancelled");
    await event.save();

    const going = await EventRsvp.find({ eventId: id, status: "going" });
    await notify(
      going.map((r) => String(r.userId)).filter((u) => u !== req.user.sub),
      { type: "event", title: "Event cancelled", body: event.title, link: `/app/communities/${String(event.communityId)}` },
    );
    return { ok: true };
  });
}
