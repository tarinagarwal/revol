import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { FilePicker, Grid, IconButton, ProgressBar, Skeleton, Stack, Text, Tooltip, toast } from "@/components/ui";
import { CameraIcon, CloseIcon, HeartIcon, ShieldIcon, PlusIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { getPhotos, uploadPhoto, deletePhoto, reorderPhotos, type Photo } from "./media.api";

const MAX_PHOTOS = 6;
const ACCEPT = "image/jpeg,image/png,image/webp";

/**
 * Epic 4 — the 6-slot photo grid. Upload w/ progress + retry, delete,
 * make-primary. Native platforms use the Capacitor camera/gallery.
 */
export function PhotoManager() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["photos"], queryFn: getPhotos });
  const [uploads, setUploads] = useState<Record<string, { pct: number; failed?: File }>>({});

  const photos = data?.photos ?? [];
  const busy = Object.keys(uploads).length;
  const slotsLeft = MAX_PHOTOS - photos.length - busy;

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["photos"] });

  const startUpload = (file: File | Blob, key: string) => {
    setUploads((u) => ({ ...u, [key]: { pct: 0 } }));
    uploadPhoto(file, (pct) => setUploads((u) => ({ ...u, [key]: { ...u[key], pct } })))
      .then(() => {
        setUploads((u) => {
          const { [key]: _done, ...rest } = u;
          return rest;
        });
        void refresh();
      })
      .catch((err: Error) => {
        toast(err.message, "error");
        setUploads((u) => ({
          ...u,
          [key]: { pct: 0, ...(file instanceof File ? { failed: file } : {}) },
        }));
      });
  };

  const handleFiles = (files: File[]) => {
    files.slice(0, Math.max(slotsLeft, 0)).forEach((f, i) => startUpload(f, `${Date.now()}-${i}-${f.name}`));
  };

  const pickNative = async () => {
    try {
      const { Camera } = await import("@capacitor/camera");
      const result = await Camera.pickImages({ quality: 82, limit: Math.max(slotsLeft, 1) });
      for (const [i, p] of result.photos.entries()) {
        if (!p.webPath) continue;
        const blob = await (await fetch(p.webPath)).blob();
        startUpload(blob, `${Date.now()}-native-${i}`);
      }
    } catch {
      // Cancelled or denied — silent.
    }
  };

  const makePrimary = async (photo: Photo) => {
    const ids = [photo.id, ...photos.filter((p) => p.id !== photo.id).map((p) => p.id)];
    await reorderPhotos(ids).catch(() => toast("Could not reorder", "error"));
    void refresh();
  };

  const remove = async (photo: Photo) => {
    await deletePhoto(photo.id).catch(() => toast("Could not delete", "error"));
    void refresh();
  };

  const addTrigger = (
    <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-charcoal text-ivory-dim transition-colors duration-base ease-elegant hover:border-gold hover:text-gold">
      {Capacitor.isNativePlatform() ? <CameraIcon size={24} /> : <PlusIcon size={24} />}
      <Text variant="caption" tone="dim">
        Add photo
      </Text>
    </div>
  );

  return (
    <Stack gap={6}>
      <Grid gap={4} className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {isLoading &&
          Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="aspect-[3/4] w-full rounded-2xl" />)}

        {photos.map((photo, idx) => (
          <div key={photo.id} className="group relative overflow-hidden rounded-2xl border border-charcoal bg-charcoal">
            {photo.url ? (
              <img src={photo.url} alt="Profile" className="aspect-[3/4] w-full object-cover" />
            ) : (
              <Skeleton className="aspect-[3/4] w-full rounded-none" />
            )}

            {idx === 0 && (
              <span className="absolute top-2 left-2 rounded-full border border-gold/50 bg-black/70 px-2.5 py-1 font-body text-[10px] tracking-elegant uppercase text-gold backdrop-blur">
                Primary
              </span>
            )}

            {photo.ai.analyzed && photo.ai.flaggedReason && (
              <Tooltip content={photo.ai.flaggedReason}>
                <span className="absolute bottom-2 left-2 flex size-7 items-center justify-center rounded-full border border-crimson/60 bg-black/70 text-crimson backdrop-blur">
                  <ShieldIcon size={14} />
                </span>
              </Tooltip>
            )}

            <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 transition-opacity duration-base group-hover:opacity-100">
              {idx !== 0 && (
                <IconButton label="Make primary" variant="solid" size="sm" onPress={() => void makePrimary(photo)}>
                  <HeartIcon size={14} />
                </IconButton>
              )}
              <IconButton label="Delete photo" variant="solid" size="sm" onPress={() => void remove(photo)}>
                <CloseIcon size={14} />
              </IconButton>
            </div>
          </div>
        ))}

        {Object.entries(uploads).map(([key, u]) => (
          <div
            key={key}
            className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-charcoal bg-rich-black p-4"
          >
            {u.failed ? (
              <>
                <Text variant="caption" tone="crimson">
                  Failed
                </Text>
                <button
                  type="button"
                  onClick={() => startUpload(u.failed!, key)}
                  className="cursor-pointer border-none bg-transparent p-0 font-body text-xs text-gold"
                >
                  Retry
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setUploads((prev) => {
                      const { [key]: _gone, ...rest } = prev;
                      return rest;
                    })
                  }
                  className="cursor-pointer border-none bg-transparent p-0 font-body text-xs text-ivory-dim"
                >
                  Dismiss
                </button>
              </>
            ) : (
              <ProgressBar value={u.pct} label="Uploading" />
            )}
          </div>
        ))}

        {slotsLeft > 0 &&
          (Capacitor.isNativePlatform() ? (
            <button type="button" onClick={() => void pickNative()} className={cn("cursor-pointer border-none bg-transparent p-0")}>
              {addTrigger}
            </button>
          ) : (
            <FilePicker accept={ACCEPT} multiple onFiles={handleFiles} className="cursor-pointer border-none bg-transparent p-0">
              {addTrigger}
            </FilePicker>
          ))}
      </Grid>

      <Text variant="caption" tone="dim">
        {photos.length}/{MAX_PHOTOS} photos. Your face stays veiled to others until chemistry earns the reveal —
        photos are for when that moment comes.
      </Text>
    </Stack>
  );
}
