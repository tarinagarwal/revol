import { useState } from "react";
import { AudioRecorder, Button, Stack, Text, toast } from "@/components/ui";
import { skipVoiceIntro, uploadVoiceIntro } from "../onboarding.api";
import { ApiError } from "@/lib/api";

type Props = {
  initial: { durationSec: number; url: string } | null;
  onDone: () => void;
  finishing: boolean;
};

export function VoiceStep({ initial, onDone, finishing }: Props) {
  const [take, setTake] = useState<{ blob: Blob; durationSec: number } | null>(null);
  const [uploading, setUploading] = useState(false);

  const finishWithVoice = async () => {
    if (!take) return;
    setUploading(true);
    try {
      await uploadVoiceIntro(take.blob, take.durationSec);
      toast("Voice intro saved", "success");
      onDone();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const finishWithoutVoice = async () => {
    try {
      await skipVoiceIntro();
    } catch {
      // Skipping must never block completion.
    }
    onDone();
  };

  return (
    <Stack gap={8}>
      {initial && !take && (
        <Text variant="caption" tone="gold" className="text-center">
          You already have a voice intro — record again to replace it, or continue.
        </Text>
      )}
      <AudioRecorder
        onRecorded={(blob, durationSec) => setTake(blob ? { blob, durationSec } : null)}
        maxSec={60}
      />
      <Stack gap={3}>
        {take ? (
          <Button fullWidth loading={uploading || finishing} onPress={() => void finishWithVoice()}>
            Save voice and finish
          </Button>
        ) : initial ? (
          <Button fullWidth loading={finishing} onPress={onDone}>
            Finish
          </Button>
        ) : (
          <Button fullWidth variant="outline" loading={finishing} onPress={() => void finishWithoutVoice()}>
            Skip for now and finish
          </Button>
        )}
        <Text variant="caption" tone="dim" className="text-center">
          Voices carry chemistry photos can't. You can add one later.
        </Text>
      </Stack>
    </Stack>
  );
}
