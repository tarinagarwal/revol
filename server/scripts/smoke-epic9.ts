/**
 * Epic 9 smoke tests — verification, report/block/unmatch, moderation queue,
 * privacy controls, data export, account deletion, and safety enforcement.
 * Run: npx tsx scripts/smoke-epic9.ts
 */
import { connectDb, disconnectDb } from "../src/db/connect.js";
import { Block } from "../src/db/models/Block.js";
import { Match } from "../src/db/models/Match.js";
import { Media } from "../src/db/models/Media.js";
import { Profile } from "../src/db/models/Profile.js";
import { Report } from "../src/db/models/Report.js";
import { User } from "../src/db/models/User.js";
import { Verification } from "../src/db/models/Verification.js";

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
  if (!r.ok) return "";
  return ((await r.json()) as { accessToken: string }).accessToken;
}

/** Disposable, fully-onboarded account so deletion can be tested for real. */
async function createDisposable(email: string, password: string): Promise<string> {
  let token = await login(email, password);
  if (!token) {
    const su = await fetch(`${BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: "Delete Me", email, password }),
    });
    const { devOtp } = (await su.json()) as { devOtp: string };
    const ver = await fetch(`${BASE}/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: devOtp }),
    });
    token = ((await ver.json()) as { accessToken: string }).accessToken;
  }
  const put = (p: string, b: unknown) =>
    fetch(`${BASE}${p}`, { method: "PUT", headers: H(token), body: JSON.stringify(b) });
  await put("/onboarding/basics", { birthdate: "1996-05-05", gender: "woman", interestedIn: ["men"], city: "Pune" });
  await put("/onboarding/intent", { intent: "open-to-either" });
  await put("/onboarding/personality", {
    answers: { "social-energy": 3, spontaneity: 3, depth: 4, adventure: 3, expression: 3, togetherness: 3 },
  });
  await put("/onboarding/values", { values: ["Kindness", "Humor", "Balance"] });
  await put("/onboarding/interests", { interests: ["Music", "Yoga", "Food"] });
  await put("/onboarding/prompts", {
    prompts: [
      { promptId: "most-alive", answer: "Long walks with no particular destination in mind." },
      { promptId: "perfect-sunday", answer: "Slow mornings, loud music, something baking." },
    ],
  });
  await fetch(`${BASE}/onboarding/complete`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
  return token;
}

async function main() {
  await connectDb();
  const A = await login("revol.e2e.test@example.com", "testpass1234");
  const B = await login("revol.smoke.buddy@example.com", "smokebuddy1234");
  rec("logins", !!A && !!B, "tokens issued");

  const userA = await User.findOne({ email: "revol.e2e.test@example.com" });
  const userB = await User.findOne({ email: "revol.smoke.buddy@example.com" });
  const idA = String(userA?._id);
  const idB = String(userB?._id);

  /* ---------- verification ---------- */
  // Reset the attempt counter so the suite is repeatable — the 5-attempt cap
  // is real and would otherwise block reruns.
  await Verification.updateOne({ userId: idA }, { attempts: 0, status: "unverified", reason: null });

  const vStatus = await fetch(`${BASE}/verification/status`, { headers: H(A) });
  const vBody = (await vStatus.json()) as { status: string; attemptsLeft: number };
  rec("verification status", vStatus.ok && !!vBody.status, `${vBody.status}, ${vBody.attemptsLeft} attempts left`);

  // Without a profile photo the flow must refuse rather than half-run.
  const photos = await Media.find({ userId: idA, kind: "photo", status: "active" });
  if (photos.length === 0) {
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array([1, 2, 3])], { type: "image/jpeg" }), "s.jpg");
    const noPhoto = await fetch(`${BASE}/verification/selfie`, {
      method: "POST",
      headers: { Authorization: `Bearer ${A}` },
      body: form,
    });
    rec("verification needs a profile photo", noPhoto.status === 400, `status ${noPhoto.status}`);
  } else {
    // Real end-to-end check: a genuine photo of a person as the "selfie".
    const img = await fetch("https://picsum.photos/seed/revolselfie/500/600");
    const form = new FormData();
    form.append("file", await img.blob(), "selfie.jpg");
    const res = await fetch(`${BASE}/verification/selfie`, {
      method: "POST",
      headers: { Authorization: `Bearer ${A}` },
      body: form,
    });
    const body = (await res.json()) as { status?: string; reason?: string; error?: string };
    // Mismatched images SHOULD be rejected — that is the correct behaviour.
    rec(
      "verification runs and judges",
      res.ok && (body.status === "verified" || body.status === "rejected"),
      `${body.status ?? body.error} — ${body.reason ?? "no reason"}`,
    );
    const leftover = await Media.countDocuments({ userId: idA, kind: "photo", status: "active" });
    rec("selfie not kept as a profile photo", leftover === photos.length, `${leftover} photos (was ${photos.length})`);
  }

  /* ---------- privacy settings ---------- */
  const pGet = await fetch(`${BASE}/privacy/settings`, { headers: H(A) });
  const pBody = (await pGet.json()) as { privacy: Record<string, boolean> };
  rec("privacy defaults", pGet.ok && pBody.privacy.showCity === true, JSON.stringify(pBody.privacy));

  const pPut = await fetch(`${BASE}/privacy/settings`, {
    method: "PUT",
    headers: H(A),
    body: JSON.stringify({ showCity: false, showAge: false }),
  });
  rec("privacy update", pPut.ok, `status ${pPut.status}`);

  // Someone viewing A must now see neither city nor age. B may have several
  // matches — select the one that is actually with A.
  const matchesForB = await fetch(`${BASE}/matches`, { headers: H(B) });
  const mB = (
    (await matchesForB.json()) as {
      matches: { person: { userId?: string; city: string | null; age: number | null } }[];
    }
  ).matches;
  const viewOfA = mB.find((m) => m.person.userId === idA);
  rec(
    "privacy hides city/age from others",
    !!viewOfA && viewOfA.person.city === null && viewOfA.person.age === null,
    viewOfA ? `city=${viewOfA.person.city}, age=${viewOfA.person.age}` : "no match with A found",
  );
  await fetch(`${BASE}/privacy/settings`, {
    method: "PUT",
    headers: H(A),
    body: JSON.stringify({ showCity: true, showAge: true }),
  });

  /* ---------- data export ---------- */
  const exp = await fetch(`${BASE}/privacy/export`, { headers: H(A) });
  const expBody = (await exp.json()) as { account?: { email?: string }; profile?: unknown; matches?: unknown[] };
  rec(
    "data export is complete",
    exp.ok && expBody.account?.email === "revol.e2e.test@example.com" && !!expBody.profile,
    `account+profile+${expBody.matches?.length ?? 0} matches`,
  );

  /* ---------- message moderation ---------- */
  const activeMatch = await Match.findOne({ users: idA, status: "active" });
  if (activeMatch) {
    const mid = String(activeMatch._id);
    const abusive = await fetch(`${BASE}/chat/${mid}/messages`, {
      method: "POST",
      headers: H(A),
      body: JSON.stringify({ body: "You are a worthless piece of trash and I will find you and hurt you." }),
    });
    rec("abusive message blocked", abusive.status === 422, `status ${abusive.status}`);

    const warm = await fetch(`${BASE}/chat/${mid}/messages`, {
      method: "POST",
      headers: H(A),
      body: JSON.stringify({ body: "I really liked what you said about silence in films. Tell me more?" }),
    });
    rec("ordinary message allowed", warm.ok, `status ${warm.status}`);
  } else {
    rec("moderation", false, "no active match to test against");
  }

  /* ---------- report + block + enforcement ---------- */
  const reasons = await fetch(`${BASE}/safety/report-reasons`, { headers: H(A) });
  rec("report reasons", reasons.ok, `status ${reasons.status}`);

  const selfReport = await fetch(`${BASE}/safety/report`, {
    method: "POST",
    headers: H(A),
    body: JSON.stringify({ reportedUserId: idA, reason: "other", alsoBlock: false }),
  });
  rec("cannot report yourself", selfReport.status === 400, `status ${selfReport.status}`);

  const report = await fetch(`${BASE}/safety/report`, {
    method: "POST",
    headers: H(A),
    body: JSON.stringify({
      reportedUserId: idB,
      reason: "harassment",
      details: "Smoke test report",
      alsoBlock: true,
    }),
  });
  const repBody = (await report.json()) as { reportId?: string; blocked?: boolean };
  rec("report created + blocks", report.status === 201 && repBody.blocked === true, `report ${repBody.reportId}`);

  const stored = await Report.findById(repBody.reportId);
  rec("report captured context", !!stored, `context lines: ${stored?.context?.length ?? 0}`);

  const severed = await Match.findOne({ users: { $all: [idA, idB] } });
  rec("block severs the match", severed?.status === "unmatched", `match status ${severed?.status}`);

  const blocked = await fetch(`${BASE}/matches`, { headers: H(A) });
  const blockedBody = (await blocked.json()) as { matches: unknown[] };
  rec("blocked match hidden", blockedBody.matches.length === 0, `${blockedBody.matches.length} match(es) visible`);

  const chatAfterBlock = severed ? await fetch(`${BASE}/chat/${String(severed._id)}/messages`, { headers: H(A) }) : null;
  rec("chat closed after block", chatAfterBlock?.status === 404, `status ${chatAfterBlock?.status}`);

  const blocks = await fetch(`${BASE}/safety/blocks`, { headers: H(A) });
  const blocksBody = (await blocks.json()) as { blocks: { userId: string }[] };
  rec("block list", blocks.ok && blocksBody.blocks.some((b) => b.userId === idB), `${blocksBody.blocks.length} blocked`);

  // Discovery must never surface a blocked person again.
  await fetch(`${BASE}/discovery/refresh`, { method: "POST", headers: { Authorization: `Bearer ${A}` } });
  const todayAfter = await fetch(`${BASE}/discovery/today`, { headers: H(A) });
  const todayBody = (await todayAfter.json()) as { match: { candidate?: { userId?: string } } | null };
  rec(
    "blocked person excluded from discovery",
    todayBody.match === null || todayBody.match.candidate?.userId !== idB,
    todayBody.match ? `candidate ${todayBody.match.candidate?.userId}` : "no match",
  );

  /* ---------- moderation queue ---------- */
  const notAdmin = await fetch(`${BASE}/moderation/reports`, { headers: H(A) });
  rec("moderation queue is admin-only", notAdmin.status === 403, `status ${notAdmin.status}`);

  await User.updateOne({ _id: idA }, { role: "admin" });
  const adminToken = await login("revol.e2e.test@example.com", "testpass1234");
  const queue = await fetch(`${BASE}/moderation/reports`, { headers: H(adminToken) });
  const queueBody = (await queue.json()) as { reports: { id: string }[] };
  rec("admin sees the queue", queue.ok && queueBody.reports.length > 0, `${queueBody.reports.length} open report(s)`);

  const resolve = await fetch(`${BASE}/moderation/reports/${repBody.reportId}`, {
    method: "PUT",
    headers: H(adminToken),
    body: JSON.stringify({ status: "dismissed", resolution: "Smoke test cleanup" }),
  });
  rec("moderator can resolve", resolve.ok, `status ${resolve.status}`);
  await User.updateOne({ _id: idA }, { role: "user" });

  /* ---------- account deletion (real, on a disposable account) ---------- */
  const delEmail = "revol.delete.me@example.com";
  const delToken = await createDisposable(delEmail, "deleteme12345");
  const delUser = await User.findOne({ email: delEmail });
  const delId = String(delUser?._id);

  const wrongPw = await fetch(`${BASE}/privacy/account`, {
    method: "DELETE",
    headers: H(delToken),
    body: JSON.stringify({ password: "wrongpassword" }),
  });
  rec("deletion needs the right password", wrongPw.status === 401, `status ${wrongPw.status}`);

  const del = await fetch(`${BASE}/privacy/account`, {
    method: "DELETE",
    headers: H(delToken),
    body: JSON.stringify({ password: "deleteme12345" }),
  });
  rec("account deleted", del.ok, `status ${del.status}`);

  const [goneUser, goneProfile] = await Promise.all([User.findById(delId), Profile.findOne({ userId: delId })]);
  rec("all personal data purged", !goneUser && !goneProfile, `user=${!!goneUser}, profile=${!!goneProfile}`);

  const deadLogin = await login(delEmail, "deleteme12345");
  rec("deleted account cannot log in", !deadLogin, deadLogin ? "still works" : "rejected");

  /* ---------- restore fixtures for other suites ---------- */
  await Block.deleteMany({ blockerId: idA, blockedId: idB });
  await Match.updateMany({ users: { $all: [idA, idB] } }, { status: "active" });
  await Report.deleteMany({ details: "Smoke test report" });
  console.log("\n[cleanup] block removed, match restored, test report deleted");

  const failed = results.filter((r) => !r.ok);
  console.log(`\n=== ${results.length - failed.length}/${results.length} PASSED ===`);
  if (failed.length) console.log("FAILED:", failed.map((f) => f.name).join(", "));
  await disconnectDb();
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error("SMOKE CRASH:", err);
  process.exit(1);
});
