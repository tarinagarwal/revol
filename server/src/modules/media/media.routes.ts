import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Media } from "../../db/models/Media.js";
import { uploadMedia, deleteMedia, signedReadUrl, validateMedia } from "../../lib/storage/gcs.js";
import { enqueueJob } from "../../lib/jobs.js";

const MAX_PHOTOS = 6;

async function toPhotoDto(m: InstanceType<typeof Media>) {
  return {
    id: String(m._id),
    position: m.position,
    url: await signedReadUrl(m.objectPath).catch(() => null),
    ai: {
      analyzed: m.ai?.analyzed ?? false,
      isHuman: m.ai?.isHuman ?? null,
      safe: m.ai?.safe ?? null,
      flaggedReason: m.ai?.flaggedReason ?? null,
    },
  };
}

/** Epic 4 — profile photos on GCS with AI analysis kicked off per upload. */
export async function mediaRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", app.authenticate);

  app.get("/media/photos", async (req) => {
    const photos = await Media.find({ userId: req.user.sub, kind: "photo", status: "active" }).sort({ position: 1 });
    return { photos: await Promise.all(photos.map(toPhotoDto)) };
  });

  app.post("/media/photos", async (req, reply) => {
    const count = await Media.countDocuments({ userId: req.user.sub, kind: "photo", status: "active" });
    if (count >= MAX_PHOTOS) return reply.status(400).send({ error: `Maximum ${MAX_PHOTOS} photos` });

    const file = await req.file();
    if (!file) return reply.status(400).send({ error: "No image file" });
    const buf = await file.toBuffer();
    const invalid = validateMedia("photo", file.mimetype, buf.length);
    if (invalid) return reply.status(400).send({ error: invalid });

    const objectPath = await uploadMedia("photo", req.user.sub, file.mimetype, buf);
    const media = await Media.create({
      userId: req.user.sub,
      kind: "photo",
      objectPath,
      mimeType: file.mimetype,
      sizeBytes: buf.length,
      position: count,
    });

    await enqueueJob("photo-analyze", { mediaId: String(media._id) });
    return reply.status(201).send({ photo: await toPhotoDto(media) });
  });

  app.delete("/media/photos/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const media = await Media.findOne({ _id: id, userId: req.user.sub, kind: "photo", status: "active" });
    if (!media) return reply.status(404).send({ error: "Photo not found" });

    media.set("status", "deleted");
    await media.save();
    await deleteMedia(media.objectPath).catch(() => undefined);

    // Compact remaining positions.
    const rest = await Media.find({ userId: req.user.sub, kind: "photo", status: "active" }).sort({ position: 1 });
    await Promise.all(rest.map((m, i) => Media.updateOne({ _id: m._id }, { position: i })));
    return { ok: true };
  });

  app.put("/media/photos/order", async (req, reply) => {
    const parsed = z.object({ ids: z.array(z.string()).min(1).max(MAX_PHOTOS) }).safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Invalid order" });

    const photos = await Media.find({ userId: req.user.sub, kind: "photo", status: "active" });
    const owned = new Set(photos.map((p) => String(p._id)));
    if (!parsed.data.ids.every((id) => owned.has(id)) || parsed.data.ids.length !== photos.length) {
      return reply.status(400).send({ error: "Order must include exactly your photos" });
    }
    await Promise.all(parsed.data.ids.map((id, i) => Media.updateOne({ _id: id }, { position: i })));
    return { ok: true };
  });
}
