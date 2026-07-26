import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Preferences, getOrCreatePreferences } from "../../db/models/Preferences.js";

const updateSchema = z
  .object({
    ageMin: z.number().int().min(18).max(100).optional(),
    ageMax: z.number().int().min(18).max(100).optional(),
    cityPreference: z.enum(["same", "anywhere"]).optional(),
    intents: z.array(z.enum(["long-term", "slow-discovery", "open-to-either", "friendship-first"])).optional(),
    paused: z.boolean().optional(),
  })
  .refine((v) => v.ageMin === undefined || v.ageMax === undefined || v.ageMin <= v.ageMax, {
    message: "Minimum age must not exceed maximum",
  });

function toDto(p: InstanceType<typeof Preferences>) {
  return {
    ageMin: p.ageMin,
    ageMax: p.ageMax,
    cityPreference: p.cityPreference,
    intents: p.intents ?? [],
    paused: p.paused,
  };
}

/** Epic 6 — discovery preferences. */
export async function preferencesRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", app.authenticate);

  app.get("/preferences", async (req) => ({ preferences: toDto(await getOrCreatePreferences(req.user.sub)) }));

  app.put("/preferences", async (req, reply) => {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.issues[0]?.message ?? "Invalid input" });

    const prefs = await getOrCreatePreferences(req.user.sub);
    prefs.set(parsed.data);
    if ((prefs.ageMin ?? 18) > (prefs.ageMax ?? 60)) {
      return reply.status(400).send({ error: "Minimum age must not exceed maximum" });
    }
    await prefs.save();
    return { preferences: toDto(prefs) };
  });
}
