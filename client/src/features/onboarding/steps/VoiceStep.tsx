import { useEffect, useRef, useState } from "react";
import { AudioRecorder, Button, IconButton, Stack, Text, toast } from "@/components/ui";
import { PlayIcon, PauseIcon, MicIcon } from "@/components/icons";
import { skipVoiceIntro, uploadVoiceIntro } from "../onboarding.api";
import { ApiError } from "@/lib/api";

type Props = {
  initial: { durationSec: number; url: string | null } | null;
  onDone: () => void;
  finishing: boolean;
};

function fmt(s: number): string {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

/** Plays back the already-saved intro from its signed URL. */
function SavedIntro({ url, durationSec }: { url: string; durationSec: number }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(
    () => () => {
      audioRef.current?.pause();
    },
    [],
  );

  const toggle = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.onended = () => setPlaying(false);
      audioRef.current.onerror = () => {
        setPlaying(false);
        toast("Could not play saved intro", "error");
      };
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      void audioRef.current.play();
      setPlaying(true);
    }
  };

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gold/40 bg-rich-black p-5">
      <IconButton label={playing ? "Pause saved intro" : "Play saved intro"} variant="solid" size="lg" onPress={toggle}>
        {playing ? <PauseIcon size={22} /> : <PlayIcon size={22} />}
      </IconButton>
      <Stack gap={0} className="flex-1">
        <Text variant="body" tone="gold">
          Your saved voice intro
        </Text>
        <Text variant="caption" tone="dim">
          {durationSec > 0 ? fmt(durationSec) : "Saved"} — record below to replace it
        </Text>
      </Stack>
      <MicIcon size={18} className="text-ivory-dim" />
    </div>
  );
}

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
      {initial?.url && !take && <SavedIntro url={initial.url} durationSec={initial.durationSec} />}
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
            Keep saved intro and finish
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
