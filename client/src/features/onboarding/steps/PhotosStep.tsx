import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Stack, Text, toast } from "@/components/ui";
import { PhotoManager } from "@/features/media/PhotoManager";
import { finishPhotos } from "../onboarding.api";
import { ApiError } from "@/lib/api";

type Props = {
  photoCount: number;
  onSaved: () => void;
};

/**
 * Photos come late by design — depth first, appearance last. At least one is
 * required: the reveal mechanic has nothing to reveal without it.
 */
export function PhotosStep({ photoCount, onSaved }: Props) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await finishPhotos();
      void queryClient.invalidateQueries({ queryKey: ["onboarding-state"] });
      onSaved();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Add at least one photo", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap={6}>
      <Text variant="caption" tone="dim" className="leading-relaxed">
        Nobody sees these until chemistry earns the reveal — they stay blurred while you talk. Your first photo is
        the one that surfaces when the blur finally lifts.
      </Text>
      <PhotoManager />
      <Stack gap={3}>
        <Button fullWidth loading={saving} onPress={() => void submit()}>
          Continue
        </Button>
        {photoCount === 0 && (
          <Text variant="caption" tone="dim" className="text-center">
            At least one photo is needed to continue.
          </Text>
        )}
      </Stack>
    </Stack>
  );
}
