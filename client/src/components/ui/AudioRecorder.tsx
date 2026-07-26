import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { blobToWav } from "@/lib/audio";
import { Text } from "./Text";
import { IconButton } from "./IconButton";
import { MicIcon, PlayIcon, PauseIcon, CloseIcon } from "@/components/icons";

type AudioRecorderProps = {
  /** Fired when a take is finalized (or cleared with null). */
  onRecorded: (blob: Blob | null, durationSec: number) => void;
  maxSec?: number;
  className?: string;
};

function fmt(s: number): string {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

/**
 * Voice capture — MediaRecorder wrapped in brand UI.
 * Idle → recording (crimson glow pulse + timer) → preview (play / discard).
 */
export function AudioRecorder({ onRecorded, maxSec = 60, className }: AudioRecorderProps) {
  const [state, setState] = useState<"idle" | "recording" | "preview">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const durationRef = useRef(0);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  const start = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : {});
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const raw = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        // WAV everywhere — AI models and every player accept it; opus doesn't.
        void blobToWav(raw)
          .catch(() => raw)
          .then((finalBlob) => {
            if (urlRef.current) URL.revokeObjectURL(urlRef.current);
            urlRef.current = URL.createObjectURL(finalBlob);
            audioRef.current = null;
            setState("preview");
            onRecorded(finalBlob, durationRef.current);
          });
      };
      rec.start();
      recorderRef.current = rec;
      setElapsed(0);
      durationRef.current = 0;
      setState("recording");
      timerRef.current = setInterval(() => {
        setElapsed((e) => {
          const next = e + 1;
          durationRef.current = next;
          if (next >= maxSec) stop();
          return next;
        });
      }, 1000);
    } catch {
      setError("Microphone unavailable — check permissions.");
    }
  };

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  };

  const discard = () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    audioRef.current = null;
    setPlaying(false);
    setElapsed(0);
    setState("idle");
    onRecorded(null, 0);
  };

  const togglePlay = () => {
    if (!urlRef.current) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(urlRef.current);
      audioRef.current.onended = () => setPlaying(false);
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
    <div className={cn("flex flex-col items-center gap-4 rounded-2xl border border-charcoal bg-rich-black p-8", className)}>
      {state === "idle" && (
        <>
          <button
            type="button"
            onClick={() => void start()}
            aria-label="Start recording"
            className="flex size-20 cursor-pointer items-center justify-center rounded-full border border-crimson/50 text-crimson outline-none transition-all duration-slow ease-elegant hover:bg-crimson/10 hover:shadow-glow-crimson focus-visible:ring-2 focus-visible:ring-gold/70"
          >
            <MicIcon size={32} />
          </button>
          <Text variant="caption" tone="dim">
            Tap to record — up to {fmt(maxSec)}
          </Text>
        </>
      )}

      {state === "recording" && (
        <>
          <button
            type="button"
            onClick={stop}
            aria-label="Stop recording"
            className="flex size-20 cursor-pointer items-center justify-center rounded-full bg-crimson text-ivory outline-none animate-[revol-glow-pulse_1.6s_ease-in-out_infinite]"
          >
            <span className="size-6 rounded-sm bg-ivory" />
          </button>
          <Text variant="heading" tone="crimson">
            {fmt(elapsed)}
          </Text>
          <Text variant="caption" tone="dim">
            Recording — tap to stop
          </Text>
        </>
      )}

      {state === "preview" && (
        <>
          <div className="flex items-center gap-4">
            <IconButton label={playing ? "Pause" : "Play"} variant="solid" size="lg" onPress={togglePlay}>
              {playing ? <PauseIcon size={22} /> : <PlayIcon size={22} />}
            </IconButton>
            <Text variant="heading" tone="gold">
              {fmt(elapsed)}
            </Text>
            <IconButton label="Discard take" variant="outline" size="lg" onPress={discard}>
              <CloseIcon size={20} />
            </IconButton>
          </div>
          <Text variant="caption" tone="dim">
            Listen back — or discard and try again
          </Text>
        </>
      )}

      {error && (
        <Text variant="caption" tone="crimson">
          {error}
        </Text>
      )}
    </div>
  );
}
