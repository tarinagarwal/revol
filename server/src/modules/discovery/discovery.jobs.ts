import { Profile } from "../../db/models/Profile.js";
import { registerJobHandler } from "../../lib/jobs.js";
import { getToday } from "./discovery.service.js";

/**
 * Daily pacing (Epic 7) — QStash cron hits /jobs/daily-matches every morning
 * (07:00 IST) and pre-generates each member's introduction, so the card is
 * waiting the moment they open the app. Anticipation, engineered.
 */
registerJobHandler("daily-matches", async () => {
  const profiles = await Profile.find({ "onboarding.completed": true }).select("userId");
  let generated = 0;
  for (const p of profiles) {
    try {
      const res = await getToday(String(p.userId));
      if (res.match) generated++;
    } catch {
      // One member failing must not stop the morning run.
    }
  }
  console.log(`[jobs] daily-matches: ${generated}/${profiles.length} introductions ready`);
});
