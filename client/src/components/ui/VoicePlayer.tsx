import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { IconButton } from "./IconButton";
import { Text } from "./Text";
import { PlayIcon, PauseIcon, MicIcon } from "@/components/icons";

type VoicePlayerProps = {
  url: string;
  title?: string;
  subtitle?: string;
  durationSec?: number;
  /** gold = premium framing (saved intro), default = quiet charcoal. */
  variant?: "default" | "gold";
  className?: string;
};

function fmt(s: number): string {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

/** Audio playback card — voice intros, voice notes. */
export function VoicePlayer({ url, title = "Voice intro", subtitle, durationSec = 0, variant = "default", className }: VoicePlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
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
      audioRef.current.onended = () => {
        setPlaying(false);
        setProgress(0);
      };
      audioRef.current.ontimeupdate = () => {
        const a = audioRef.current;
        if (a?.duration && Number.isFinite(a.duration)) setProgress((a.currentTime / a.duration) * 100);
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
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl border bg-rich-black p-4",
        variant === "gold" ? "border-gold/40" : "border-charcoal",
        className,
      )}
    >
      <IconButton label={playing ? "Pause" : "Play"} variant="solid" size="lg" onPress={toggle}>
        {playing ? <PauseIcon size={22} /> : <PlayIcon size={22} />}
      </IconButton>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Text variant="body" tone={variant === "gold" ? "gold" : "ivory"} className="truncate">
          {title}
        </Text>
        {subtitle && (
          <Text variant="caption" tone="dim" className="truncate">
            {subtitle}
          </Text>
        )}
        <div className="h-1 w-full overflow-hidden rounded-full bg-charcoal">
          <div
            className="h-full rounded-full bg-crimson transition-[width] duration-300 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <MicIcon size={16} className="text-ivory-dim" />
        {durationSec > 0 && (
          <Text variant="caption" tone="dim">
            {fmt(durationSec)}
          </Text>
        )}
      </div>
    </div>
  );
}
