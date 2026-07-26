import { Message } from "../../db/models/Message.js";
import { registerJobHandler } from "../../lib/jobs.js";
import { downloadMedia } from "../../lib/storage/gcs.js";
import { analyzeVoice } from "../ai/ai.service.js";
import { evaluateReveal } from "./reveal.service.js";

/** Reveal re-evaluation after each message — off the request path. */
registerJobHandler("evaluate-reveal", async (payload) => {
  const matchId = String(payload.matchId ?? "");
  if (matchId) await evaluateReveal(matchId);
});

/** Voice notes get transcribed so they count toward conversation depth. */
registerJobHandler("transcribe-voice-note", async (payload) => {
  const messageId = String(payload.messageId ?? "");
  const message = await Message.findById(messageId);
  if (!message?.objectPath) return;

  const buf = await downloadMedia(message.objectPath);
  const result = await analyzeVoice(buf, "audio/wav");
  message.set("transcript", result.transcript || null);
  await message.save();
});
