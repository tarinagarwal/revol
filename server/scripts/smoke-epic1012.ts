/**
 * Epics 10 + 12 smoke tests — communities, membership, events, RSVP capacity,
 * notifications, preferences, device registration — plus the new onboarding
 * steps (lifestyle + required photos).
 * Run: npx tsx scripts/smoke-epic1012.ts
 */
import { connectDb, disconnectDb } from "../src/db/connect.js";
import { Community, CommunityMember } from "../src/db/models/Community.js";
import { Event } from "../src/db/models/Event.js";
import { Notification } from "../src/db/models/Notification.js";
import { User } from "../src/db/models/User.js";

const BASE = process.env.SMOKE_BASE ?? "http://localhost:8080";
const results: { name: string; ok: boolean; detail: string }[] = [];
const rec = (name: string, ok: boolean, detail: string) => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} — ${name}: ${detail}`);
};
const H = (t: string) => ({ Authorization: `Bearer ${t}`, "Content-Type": "application/json" });

async function login(email: string, password: string): Promise<string> {
  const r = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return r.ok ? ((await r.json()) as { accessToken: string }).accessToken : "";
}

async function main() {
  await connectDb();
  const A = await login("revol.e2e.test@example.com", "testpass1234");
  const B = await login("revol.smoke.buddy@example.com", "smokebuddy1234");
  rec("logins", !!A && !!B, "tokens issued");

  /* ---------- onboarding additions ---------- */
  const config = (await (await fetch(`${BASE}/onboarding/config`, { headers: H(A) })).json()) as {
    education?: unknown[];
    languages?: unknown[];
    rules?: { photos?: { min: number } };
  };
  rec(
    "onboarding config exposes lifestyle + photo rules",
    !!config.education?.length && !!config.languages?.length && config.rules?.photos?.min === 1,
    `education=${config.education?.length}, languages=${config.languages?.length}, minPhotos=${config.rules?.photos?.min}`,
  );

  const lifestyle = await fetch(`${BASE}/onboarding/lifestyle`, {
    method: "PUT",
    headers: H(A),
    body: JSON.stringify({
      heightCm: 178,
      work: "Software",
      education: "undergraduate",
      drinking: "socially",
      smoking: "never",
      kids: "want-someday",
      languages: ["English", "Hindi"],
    }),
  });
  rec("lifestyle saves", lifestyle.ok, `status ${lifestyle.status}`);

  const state = (await (await fetch(`${BASE}/onboarding/state`, { headers: H(A) })).json()) as {
    sections: { lifestyle?: { work?: string }; photoCount?: number };
  };
  rec(
    "lifestyle + photoCount in state",
    state.sections.lifestyle?.work === "Software" && typeof state.sections.photoCount === "number",
    `work=${state.sections.lifestyle?.work}, photos=${state.sections.photoCount}`,
  );

  // A brand-new account has no photos, so the step must refuse. (Using a
  // fresh account keeps this assertion true no matter what other suites do.)
  const freshEmail = `revol.photocheck.${Date.now()}@example.com`;
  const freshSignup = await fetch(`${BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ displayName: "Photo Check", email: freshEmail, password: "photocheck12345" }),
  });
  const { devOtp } = (await freshSignup.json()) as { devOtp: string };
  const freshVerify = await fetch(`${BASE}/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: freshEmail, code: devOtp }),
  });
  const freshToken = ((await freshVerify.json()) as { accessToken: string }).accessToken;

  const badPhotos = await fetch(`${BASE}/onboarding/photos-done`, {
    method: "POST",
    headers: { Authorization: `Bearer ${freshToken}` },
  });
  rec("photos step requires a photo", badPhotos.status === 400, `status ${badPhotos.status}`);
  await User.deleteOne({ email: freshEmail });

  /* ---------- communities ---------- */
  const topics = (await (await fetch(`${BASE}/communities/topics`, { headers: H(A) })).json()) as {
    topics: string[];
  };
  rec("topics list", topics.topics.length > 0, `${topics.topics.length} topics`);

  const badCreate = await fetch(`${BASE}/communities`, {
    method: "POST",
    headers: H(A),
    body: JSON.stringify({ name: "x", description: "short", topic: "film" }),
  });
  rec("community validation", badCreate.status === 400, `status ${badCreate.status}`);

  const created = await fetch(`${BASE}/communities`, {
    method: "POST",
    headers: H(A),
    body: JSON.stringify({
      name: "Sunday Film Club",
      description: "We watch something slow and talk about it afterwards over coffee.",
      topic: "film",
      city: "Bangalore",
    }),
  });
  const createdBody = (await created.json()) as { id?: string };
  const communityId = createdBody.id ?? "";
  rec("community created", created.status === 201 && !!communityId, communityId);

  const creatorIsHost = await CommunityMember.findOne({ communityId, role: "host" });
  rec("creator becomes host", !!creatorIsHost, `role ${creatorIsHost?.role}`);

  const browse = await fetch(`${BASE}/communities?topic=film`, { headers: H(A) });
  const browseBody = (await browse.json()) as { communities: { id: string; joined: boolean }[] };
  const mine = browseBody.communities.find((c) => c.id === communityId);
  rec("browse by topic + joined flag", !!mine && mine.joined === true, `${browseBody.communities.length} found`);

  const join = await fetch(`${BASE}/communities/${communityId}/join`, {
    method: "POST",
    headers: { Authorization: `Bearer ${B}` },
  });
  const joinBody = (await joinBody_(join)) as { memberCount?: number };
  rec("second member joins", join.ok && joinBody.memberCount === 2, `members ${joinBody.memberCount}`);

  /* ---------- events ---------- */
  const nonMemberEvent = await fetch(`${BASE}/communities/${communityId}/events`, {
    method: "POST",
    headers: H(await login("revol.prod.smoke@example.com", "smoketest1234")),
    body: JSON.stringify({
      title: "Sneaky event",
      description: "Should not be allowed for non-members.",
      startsAt: new Date(Date.now() + 86_400_000).toISOString(),
      location: "Nowhere",
    }),
  });
  rec("non-members cannot host", nonMemberEvent.status === 403 || nonMemberEvent.status === 401, `status ${nonMemberEvent.status}`);

  const pastEvent = await fetch(`${BASE}/communities/${communityId}/events`, {
    method: "POST",
    headers: H(A),
    body: JSON.stringify({
      title: "Time traveller",
      description: "An event set in the past should be rejected.",
      startsAt: new Date(Date.now() - 86_400_000).toISOString(),
      location: "Yesterday",
    }),
  });
  rec("past events rejected", pastEvent.status === 400, `status ${pastEvent.status}`);

  const eventRes = await fetch(`${BASE}/communities/${communityId}/events`, {
    method: "POST",
    headers: H(A),
    body: JSON.stringify({
      title: "Tarkovsky double bill",
      description: "Two films, one long conversation afterwards. Bring your own interpretation.",
      startsAt: new Date(Date.now() + 3 * 86_400_000).toISOString(),
      location: "Blue Tokai, Indiranagar",
      capacity: 1,
    }),
  });
  const eventBody = (await eventRes.json()) as { id?: string };
  const eventId = eventBody.id ?? "";
  rec("event created", eventRes.status === 201 && !!eventId, eventId);

  // Members were notified about the new gathering (Epic 12 wiring).
  const buddyNotifs = await fetch(`${BASE}/notifications`, { headers: H(B) });
  const buddyNotifBody = (await buddyNotifs.json()) as { notifications: { type: string; title: string }[] };
  rec(
    "event notifies community members",
    buddyNotifBody.notifications.some((n) => n.type === "event"),
    buddyNotifBody.notifications[0]?.title ?? "none",
  );

  const rsvpRes = await fetch(`${BASE}/events/${eventId}/rsvp`, {
    method: "POST",
    headers: H(B),
    body: JSON.stringify({ status: "going" }),
  });
  const rsvpBody = (await rsvpRes.json()) as { goingCount?: number };
  rec("RSVP going", rsvpRes.ok && rsvpBody.goingCount === 1, `going ${rsvpBody.goingCount}`);

  // Capacity is 1 and already taken.
  const full = await fetch(`${BASE}/events/${eventId}/rsvp`, {
    method: "POST",
    headers: H(A),
    body: JSON.stringify({ status: "going" }),
  });
  rec("capacity enforced", full.status === 400, `status ${full.status}`);

  const interested = await fetch(`${BASE}/events/${eventId}/rsvp`, {
    method: "POST",
    headers: H(A),
    body: JSON.stringify({ status: "interested" }),
  });
  rec("interested still allowed when full", interested.ok, `status ${interested.status}`);

  const eventsList = await fetch(`${BASE}/events?scope=mine`, { headers: H(B) });
  const eventsBody = (await eventsList.json()) as { events: { id: string; myRsvp: string | null }[] };
  const listed = eventsBody.events.find((e) => e.id === eventId);
  rec("event discovery shows my RSVP", !!listed && listed.myRsvp === "going", `rsvp ${listed?.myRsvp}`);

  const detail = await fetch(`${BASE}/events/${eventId}`, { headers: H(B) });
  const detailBody = (await detail.json()) as { event: { attendees: unknown[]; communityName: string } };
  rec(
    "event detail with attendees",
    detail.ok && detailBody.event.attendees.length === 1,
    `${detailBody.event.attendees.length} attendee(s) in ${detailBody.event.communityName}`,
  );

  /* ---------- membership guards ---------- */
  const lastHostLeave = await fetch(`${BASE}/communities/${communityId}/leave`, {
    method: "DELETE",
    headers: H(A),
  });
  rec("last host cannot abandon community", lastHostLeave.status === 400, `status ${lastHostLeave.status}`);

  const memberLeave = await fetch(`${BASE}/communities/${communityId}/leave`, {
    method: "DELETE",
    headers: H(B),
  });
  const leaveBody = (await memberLeave.json()) as { memberCount?: number };
  rec("member can leave", memberLeave.ok && leaveBody.memberCount === 1, `members ${leaveBody.memberCount}`);

  /* ---------- notifications ---------- */
  const prefs = await fetch(`${BASE}/notifications/preferences`, { headers: H(A) });
  const prefsBody = (await prefs.json()) as { notifications: Record<string, boolean> };
  rec("notification prefs default on", prefs.ok && prefsBody.notifications.matches === true, JSON.stringify(prefsBody.notifications));

  const mute = await fetch(`${BASE}/notifications/preferences`, {
    method: "PUT",
    headers: H(A),
    body: JSON.stringify({ events: false }),
  });
  rec("prefs update", mute.ok, `status ${mute.status}`);

  // With events muted, a new gathering must not reach A.
  await Notification.deleteMany({ userId: (await Community.findById(communityId))?.createdBy, type: "event" });
  await fetch(`${BASE}/communities/${communityId}/join`, { method: "POST", headers: { Authorization: `Bearer ${B}` } });
  await fetch(`${BASE}/communities/${communityId}/events`, {
    method: "POST",
    headers: H(B),
    body: JSON.stringify({
      title: "Muted gathering",
      description: "A should not be notified about this one at all.",
      startsAt: new Date(Date.now() + 5 * 86_400_000).toISOString(),
      location: "Somewhere quiet",
    }),
  });
  const afterMute = await fetch(`${BASE}/notifications`, { headers: H(A) });
  const afterMuteBody = (await afterMute.json()) as { notifications: { type: string }[] };
  rec(
    "muted type is not delivered",
    !afterMuteBody.notifications.some((n) => n.type === "event"),
    `${afterMuteBody.notifications.filter((n) => n.type === "event").length} event notifications`,
  );
  await fetch(`${BASE}/notifications/preferences`, {
    method: "PUT",
    headers: H(A),
    body: JSON.stringify({ events: true }),
  });

  const markRead = await fetch(`${BASE}/notifications/read`, {
    method: "POST",
    headers: H(B),
    body: JSON.stringify({}),
  });
  const afterRead = await fetch(`${BASE}/notifications`, { headers: H(B) });
  const afterReadBody = (await afterRead.json()) as { unread: number };
  rec("mark all read", markRead.ok && afterReadBody.unread === 0, `unread ${afterReadBody.unread}`);

  const device = await fetch(`${BASE}/notifications/devices`, {
    method: "POST",
    headers: H(A),
    body: JSON.stringify({ token: `smoke-token-${Date.now()}`, platform: "android" }),
  });
  rec("device registration", device.ok, `status ${device.status}`);

  /* ---------- cleanup ---------- */
  await Event.deleteMany({ communityId });
  await CommunityMember.deleteMany({ communityId });
  await Community.deleteOne({ _id: communityId });
  await Notification.deleteMany({ type: "event" });
  console.log("\n[cleanup] test community, events and notifications removed");

  const failed = results.filter((r) => !r.ok);
  console.log(`\n=== ${results.length - failed.length}/${results.length} PASSED ===`);
  if (failed.length) console.log("FAILED:", failed.map((f) => f.name).join(", "));
  await disconnectDb();
  process.exit(failed.length ? 1 : 0);
}

/** Small helper so a failed join still yields a parseable body. */
async function joinBody_(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

main().catch((err) => {
  console.error("SMOKE CRASH:", err);
  process.exit(1);
});
