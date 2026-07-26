import type { Profile } from "../../db/models/Profile.js";
import { PERSONALITY_QUESTIONS, INTENTS } from "./onboarding.data.js";

/**
 * The narrative text a profile becomes — consumed by Upstash Vector
 * (hosted embedding) and by every AI prompt that reasons about a person.
 */
export function buildProfileText(p: InstanceType<typeof Profile>): string {
  const persona = PERSONALITY_QUESTIONS.map((q) => {
    const v = p.personality?.get(q.id) ?? 3;
    const lean = v <= 2 ? q.low : v >= 4 ? q.high : `between ${q.low} and ${q.high}`;
    return `${q.text} Leans: ${lean} (${v}/5)`;
  }).join(" ");
  const prompts = (p.prompts ?? []).map((pr) => `${pr.question} ${pr.answer}`).join(" ");
  const intentLabel = INTENTS.find((i) => i.id === p.intent)?.label ?? p.intent ?? "";
  const l = p.lifestyle;
  const lifestyle = l
    ? [
        l.work ? `works in ${l.work}` : "",
        l.education ? `education: ${l.education}` : "",
        l.drinking ? `drinks ${l.drinking}` : "",
        l.smoking ? `smokes ${l.smoking}` : "",
        l.kids ? `on children: ${l.kids}` : "",
        l.languages?.length ? `speaks ${l.languages.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join("; ")
    : "";

  return [
    `Intent: ${intentLabel}.`,
    lifestyle ? `Lifestyle: ${lifestyle}.` : "",
    `Values: ${(p.values ?? []).join(", ")}.`,
    `Interests: ${(p.interests ?? []).join(", ")}.`,
    `Personality: ${persona}`,
    `In their words: ${prompts}`,
    p.voiceIntro?.transcript ? `Voice intro: ${p.voiceIntro.transcript}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
