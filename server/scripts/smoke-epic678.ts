/**
 * Epics 6 + 7 + 8 smoke tests — preferences filtering, mutual matching,
 * chat, realtime SSE, and the reveal engine. Run: npx tsx scripts/smoke-epic678.ts
 */
import { connectDb, disconnectDb } from "../src/db/connect.js";
import { Match } from "../src/db/models/Match.js";
import { Message } from "../src/db/models/Message.js";

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
  return ((await r.json()) as { accessToken: string }).accessToken;
}

async function main() {
  await connectDb();
  const A = await login("revol.e2e.test@example.com", "testpass1234");
  const B = await login("revol.smoke.buddy@example.com", "smokebuddy1234");
  rec("logins", !!A && !!B, "both tokens issued");

  /* ---------- Epic 6: preferences ---------- */
  const prefsGet = await fetch(`${BASE}/preferences`, { headers: H(A) });
  const prefs = (await prefsGet.json()) as { preferences: { ageMin: number; ageMax: number } };
  rec("preferences defaults", prefsGet.ok && prefs.preferences.ageMin === 18, JSON.stringify(prefs.preferences));

  const badRange = await fetch(`${BASE}/preferences`, {
    method: "PUT",
    headers: H(A),
    body: JSON.stringify({ ageMin: 40, ageMax: 30 }),
  });
  rec("invalid age range rejected", badRange.status === 400, `status ${badRange.status}`);

  const upd = await fetch(`${BASE}/preferences`, {
    method: "PUT",
    headers: H(A),
    body: JSON.stringify({ ageMin: 21, ageMax: 45, cityPreference: "same" }),
  });
  const updBody = (await upd.json()) as { preferences: { ageMin: number; cityPreference: string } };
  rec("preferences update", upd.ok && updBody.preferences.ageMin === 21, JSON.stringify(updBody.preferences));

  // Filter proof: an impossible age window must yield no introduction.
  await fetch(`${BASE}/preferences`, { method: "PUT", headers: H(A), body: JSON.stringify({ ageMin: 99, ageMax: 100 }) });
  await fetch(`${BASE}/discovery/refresh`, { method: "POST", headers: { Authorization: `Bearer ${A}` } });
  const filtered = await fetch(`${BASE}/discovery/today`, { headers: H(A) });
  const filteredBody = (await filtered.json()) as { match: unknown };
  rec("age filter excludes candidates", filteredBody.match === null, filteredBody.match === null ? "no match (correct)" : "match leaked through");

  // Restore sane preferences.
  await fetch(`${BASE}/preferences`, {
    method: "PUT",
    headers: H(A),
    body: JSON.stringify({ ageMin: 18, ageMax: 60, cityPreference: "anywhere", intents: [] }),
  });

  const paused = await fetch(`${BASE}/preferences`, { method: "PUT", headers: H(A), body: JSON.stringify({ paused: true }) });
  await fetch(`${BASE}/discovery/refresh`, { method: "POST", headers: { Authorization: `Bearer ${A}` } });
  const whilePaused = await fetch(`${BASE}/discovery/today`, { headers: H(A) });
  const pausedBody = (await whilePaused.json()) as { match: unknown };
  rec("pause stops introductions", paused.ok && pausedBody.match === null, pausedBody.match === null ? "paused (correct)" : "match served while paused");
  await fetch(`${BASE}/preferences`, { method: "PUT", headers: H(A), body: JSON.stringify({ paused: false }) });

  /* ---------- Epic 7: the existing mutual match ---------- */
  const matchesRes = await fetch(`${BASE}/matches`, { headers: H(A) });
  const matches = ((await matchesRes.json()) as { matches: { id: string; revealLevel: number }[] }).matches;
  const matchId = matches[0]?.id ?? "";
  rec("mutual match present", !!matchId, matchId ? `match ${matchId} at reveal ${matches[0]?.revealLevel}` : "none");
  if (!matchId) throw new Error("no match to test chat against");

  // Reset the conversation so thresholds are deterministic.
  await Message.deleteMany({ matchId });
  await Match.updateOne({ _id: matchId }, { revealLevel: 2, messageCount: 0, qualityScore: 0 });

  /* ---------- Epic 8: conversations, SSE, messaging ---------- */
  const convos = await fetch(`${BASE}/chat/conversations`, { headers: H(A) });
  const convoBody = (await convos.json()) as { conversations: { matchId: string }[] };
  rec("conversation list", convos.ok && convoBody.conversations.length > 0, `${convoBody.conversations.length} conversation(s)`);

  // Browsers enforce CORS on EventSource; server-side fetch does not. Assert
  // the header explicitly — its absence silently breaks chat in the browser.
  const corsProbe = await fetch(`${BASE}/chat/stream?token=${encodeURIComponent(A)}`, {
    headers: { Origin: "https://revol-dating.vercel.app", Accept: "text/event-stream" },
  });
  const acao = corsProbe.headers.get("access-control-allow-origin");
  rec("SSE sends CORS headers (browser-usable)", acao === "https://revol-dating.vercel.app", `ACAO: ${acao ?? "MISSING"}`);
  await corsProbe.body?.cancel();

  // SSE: open a stream for B, then have A send — B must receive it live.
  const received: string[] = [];
  const controller = new AbortController();
  const streamPromise = (async () => {
    const res = await fetch(`${BASE}/chat/stream?token=${encodeURIComponent(B)}`, { signal: controller.signal });
    const reader = res.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received.push(decoder.decode(value));
    }
  })().catch(() => undefined);
  await new Promise((r) => setTimeout(r, 1500));

  const firstMsg = await fetch(`${BASE}/chat/${matchId}/messages`, {
    method: "POST",
    headers: H(A),
    body: JSON.stringify({ body: "What made you choose slow discovery over everything else?" }),
  });
  rec("send text message", firstMsg.ok, `status ${firstMsg.status}`);

  await new Promise((r) => setTimeout(r, 1500));
  const gotLive = received.join("").includes("event: message");
  rec("SSE delivers message live", gotLive, gotLive ? "event received by peer" : `frames: ${received.join("").slice(0, 80)}`);

  const typing = await fetch(`${BASE}/chat/${matchId}/typing`, { method: "POST", headers: { Authorization: `Bearer ${A}` } });
  await new Promise((r) => setTimeout(r, 800));
  rec("typing signal", typing.ok && received.join("").includes("event: typing"), `status ${typing.status}`);
  controller.abort();
  await streamPromise;

  const read = await fetch(`${BASE}/chat/${matchId}/read`, { method: "POST", headers: { Authorization: `Bearer ${B}` } });
  rec("read receipts", read.ok, `status ${read.status}`);

  const history = await fetch(`${BASE}/chat/${matchId}/messages`, { headers: H(A) });
  const historyBody = (await history.json()) as { messages: { body: string; readAt: string | null }[] };
  rec(
    "history + read state",
    history.ok && historyBody.messages.length > 0 && !!historyBody.messages[0]?.readAt,
    `${historyBody.messages.length} message(s), first readAt=${historyBody.messages[0]?.readAt ? "set" : "null"}`,
  );

  const ice = await fetch(`${BASE}/chat/${matchId}/icebreakers`, { headers: H(A) });
  const iceBody = (await ice.json()) as { icebreakers?: string[] };
  rec("AI icebreakers in chat", ice.ok && (iceBody.icebreakers?.length ?? 0) === 3, iceBody.icebreakers?.[0]?.slice(0, 60) ?? "none");

  // Membership guard: a stranger must not read the thread.
  const strangerToken = await login("revol.prod.smoke@example.com", "smoketest1234").catch(() => "");
  if (strangerToken) {
    const forbidden = await fetch(`${BASE}/chat/${matchId}/messages`, { headers: H(strangerToken) });
    rec("non-member blocked", forbidden.status === 404, `status ${forbidden.status}`);
  }

  /* ---------- Epic 7 reveal engine ---------- */
  const beforeReveal = await Match.findById(matchId);
  rec("reveal starts at 2 (mutual)", (beforeReveal?.revealLevel ?? -1) === 2, `level ${beforeReveal?.revealLevel}`);

  // One-sided volume must NOT unlock — the mutuality gate.
  for (let i = 0; i < 6; i++) {
    await fetch(`${BASE}/chat/${matchId}/messages`, {
      method: "POST",
      headers: H(A),
      body: JSON.stringify({ body: `Another thought from just me, number ${i + 2}.` }),
    });
  }
  await new Promise((r) => setTimeout(r, 4000));
  const afterOneSided = await Match.findById(matchId);
  rec("one-sided volume does not unlock", (afterOneSided?.revealLevel ?? -1) === 2, `level ${afterOneSided?.revealLevel}`);

  // Genuine two-way exchange should lift 2 → 1.
  const bReplies = [
    "Because rushing has never once given me something that lasted. What about you?",
    "I think I'm drawn to people who notice small things. You clearly do.",
    "The silence thing in films — I feel that about conversations too.",
    "Tell me something you've never said on a first date.",
    "I'd rather know how someone thinks than how they look.",
  ];
  for (const body of bReplies) {
    await fetch(`${BASE}/chat/${matchId}/messages`, { method: "POST", headers: H(B), body: JSON.stringify({ body }) });
  }
  await new Promise((r) => setTimeout(r, 8000));
  const afterMutual = await Match.findById(matchId);
  rec(
    "mutual depth lifts the veil",
    (afterMutual?.revealLevel ?? 9) < 2,
    `level ${afterMutual?.revealLevel}, quality ${afterMutual?.qualityScore}`,
  );

  const systemMsg = await Message.findOne({ matchId, kind: "system" });
  rec("reveal announced in thread", !!systemMsg, systemMsg?.body ?? "none");

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
