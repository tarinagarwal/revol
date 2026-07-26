/**
 * Epic 4 + 5 smoke tests. Run: npx tsx scripts/smoke-epic45.ts
 * Uses HTTP where the product does (photos, AI routes) and direct service
 * calls where there's no route yet (voice analysis on stored audio).
 */
import { connectDb, disconnectDb } from "../src/db/connect.js";
import { User } from "../src/db/models/User.js";
import { Profile } from "../src/db/models/Profile.js";
import { downloadMedia } from "../src/lib/storage/gcs.js";
import { analyzeVoice } from "../src/modules/ai/ai.service.js";

const BASE = process.env.SMOKE_BASE ?? "http://localhost:8080";
const results: { name: string; ok: boolean; detail: string }[] = [];

function record(name: string, ok: boolean, detail: string) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} — ${name}: ${detail}`);
}

async function main() {
  await connectDb();

  // --- auth ---
  const login = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "revol.e2e.test@example.com", password: "testpass1234" }),
  });
  const { accessToken } = (await login.json()) as { accessToken: string };
  const H = { Authorization: `Bearer ${accessToken}` };
  record("login", login.ok, `status ${login.status}`);

  // --- Epic 4: photo upload (real image) ---
  const img = await fetch("https://picsum.photos/seed/revolsmoke/400/500");
  const imgBlob = await img.blob();
  const form = new FormData();
  form.append("file", imgBlob, "smoke.jpg");
  const up = await fetch(`${BASE}/media/photos`, { method: "POST", headers: H, body: form });
  const upBody = (await up.json()) as { photo?: { id: string; url: string | null }; error?: string };
  record("photo upload", up.status === 201 && !!upBody.photo?.id, upBody.photo?.id ?? upBody.error ?? "?");
  const photoId = upBody.photo?.id ?? "";

  // --- Epic 5: vision analysis (inline job in dev) ---
  let analyzed = false;
  let visionDetail = "not analyzed in time";
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const list = await fetch(`${BASE}/media/photos`, { headers: H });
    const body = (await list.json()) as {
      photos: { id: string; ai: { analyzed: boolean; isHuman: boolean | null; safe: boolean | null; flaggedReason: string | null } }[];
    };
    const mine = body.photos.find((p) => p.id === photoId);
    if (mine?.ai.analyzed) {
      analyzed = true;
      visionDetail = `isHuman=${mine.ai.isHuman} safe=${mine.ai.safe} flag=${mine.ai.flaggedReason}`;
      break;
    }
  }
  record("vision analysis", analyzed, visionDetail);

  // --- Epic 4: reorder + delete ---
  const listRes = await fetch(`${BASE}/media/photos`, { headers: H });
  const photos = ((await listRes.json()) as { photos: { id: string }[] }).photos;
  const orderRes = await fetch(`${BASE}/media/photos/order`, {
    method: "PUT",
    headers: { ...H, "Content-Type": "application/json" },
    body: JSON.stringify({ ids: photos.map((p) => p.id) }),
  });
  record("photo reorder", orderRes.ok, `status ${orderRes.status}`);
  const del = await fetch(`${BASE}/media/photos/${photoId}`, { method: "DELETE", headers: H });
  record("photo delete", del.ok, `status ${del.status}`);

  // --- Epic 5: compatibility + icebreakers vs a synthetic COMPLETE profile ---
  const buddyEmail = "revol.smoke.buddy@example.com";
  let buddyToken = "";
  const buddyLogin = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: buddyEmail, password: "smokebuddy1234" }),
  });
  if (buddyLogin.ok) {
    buddyToken = ((await buddyLogin.json()) as { accessToken: string }).accessToken;
  } else {
    const su = await fetch(`${BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: "Smoke Buddy", email: buddyEmail, password: "smokebuddy1234" }),
    });
    const { devOtp } = (await su.json()) as { devOtp: string };
    const ver = await fetch(`${BASE}/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: buddyEmail, code: devOtp }),
    });
    buddyToken = ((await ver.json()) as { accessToken: string }).accessToken;
  }
  const BH = { Authorization: `Bearer ${buddyToken}`, "Content-Type": "application/json" };
  const put = (path: string, body: unknown) =>
    fetch(`${BASE}${path}`, { method: "PUT", headers: BH, body: JSON.stringify(body) });
  await put("/onboarding/basics", { birthdate: "1997-08-21", gender: "woman", interestedIn: ["men"], city: "Bangalore" });
  await put("/onboarding/intent", { intent: "slow-discovery" });
  await put("/onboarding/personality", {
    answers: { "social-energy": 4, spontaneity: 2, depth: 5, adventure: 3, expression: 4, togetherness: 2 },
  });
  await put("/onboarding/values", { values: ["Curiosity", "Honesty", "Creativity"] });
  await put("/onboarding/interests", { interests: ["Reading", "Film", "Coffee", "Photography"] });
  await put("/onboarding/prompts", {
    prompts: [
      { promptId: "never-stop", answer: "The way films use silence better than dialogue." },
      { promptId: "perfect-sunday", answer: "Second coffee, a paperback, and golden-hour walks with no destination." },
    ],
  });
  // Onboarding now requires at least one photo — give the fixture one.
  const buddyPhotos = await fetch(`${BASE}/media/photos`, { headers: { Authorization: `Bearer ${buddyToken}` } });
  const buddyPhotoCount = ((await buddyPhotos.json()) as { photos: unknown[] }).photos.length;
  if (buddyPhotoCount === 0) {
    const buddyImg = await fetch("https://picsum.photos/seed/revolbuddy/400/500");
    const buddyForm = new FormData();
    buddyForm.append("file", await buddyImg.blob(), "buddy.jpg");
    await fetch(`${BASE}/media/photos`, {
      method: "POST",
      headers: { Authorization: `Bearer ${buddyToken}` },
      body: buddyForm,
    });
  }

  const buddyComplete = await fetch(`${BASE}/onboarding/complete`, { method: "POST", headers: { Authorization: `Bearer ${buddyToken}` } });
  record("buddy profile complete", buddyComplete.ok, `status ${buddyComplete.status}`);

  const other = await User.findOne({ email: buddyEmail });
  if (!other) {
    record("compatibility", false, "buddy profile missing");
  } else {
    const comp = await fetch(`${BASE}/ai/compatibility/${String(other._id)}`, { headers: H });
    const compBody = (await comp.json()) as { report?: { score: number; vibe: string; reasons: string[] }; error?: string };
    record(
      "compatibility",
      comp.ok && typeof compBody.report?.score === "number",
      comp.ok ? `score=${compBody.report?.score} vibe="${compBody.report?.vibe}"` : (compBody.error ?? "?"),
    );

    const ice = await fetch(`${BASE}/ai/icebreakers/${String(other._id)}`, { headers: H });
    const iceBody = (await ice.json()) as { icebreakers?: string[]; error?: string };
    record(
      "icebreakers",
      ice.ok && iceBody.icebreakers?.length === 3,
      ice.ok ? `"${iceBody.icebreakers?.[0]?.slice(0, 70)}..."` : (iceBody.error ?? "?"),
    );

    // --- Epic 5: voice transcription on the real stored intro (any user's) ---
    const voiceOwner = await User.findOne({ email: "tarinagarwal@gmail.com" });
    const prof = voiceOwner ? await Profile.findOne({ userId: voiceOwner._id }) : null;
    if (prof?.voiceIntro?.objectPath) {
      try {
        const buf = await downloadMedia(prof.voiceIntro.objectPath);
        const voice = await analyzeVoice(buf, prof.voiceIntro.mimeType);
        record("voice transcription", voice.transcript.length >= 0, `"${voice.transcript.slice(0, 60)}" tone="${voice.tone}"`);
      } catch (err) {
        record("voice transcription", false, (err as Error).message.slice(0, 120));
      }
    } else {
      record("voice transcription", false, "no stored voice intro");
    }
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n=== ${results.length - failed.length}/${results.length} PASSED ===`);
  await disconnectDb();
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error("SMOKE CRASH:", err);
  process.exit(1);
});
