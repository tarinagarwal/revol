import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/cn";
import { Avatar, Button, IconButton, Spinner, Stack, Text, toast } from "@/components/ui";
import { ChevronLeftIcon, MicIcon, ArrowRightIcon, SparkIcon, CloseIcon, EyeOffIcon, ShieldIcon } from "@/components/icons";
import { ReportSheet } from "@/features/safety/ReportSheet";
import { blobToWav } from "@/lib/audio";
import {
  getIcebreakers,
  getMessages,
  markConversationRead,
  sendMessage,
  sendTypingSignal,
  sendVoiceNote,
  type ChatMessage,
  type Conversation,
} from "./chat.api";
import { useRealtime } from "./useRealtime";
import { enqueue, flush, pendingFor, watchConnectivity } from "./outbox";
import { ApiError } from "@/lib/api";

function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function VoiceBubble({ url, durationSec, mine }: { url: string; durationSec: number; mine: boolean }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const toggle = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
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
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "flex cursor-pointer items-center gap-2 border-none bg-transparent p-0 font-body text-sm",
        mine ? "text-ivory" : "text-ivory",
      )}
    >
      <MicIcon size={16} />
      {playing ? "Playing..." : `Voice note${durationSec ? ` · ${durationSec}s` : ""}`}
    </button>
  );
}

function Bubble({ m }: { m: ChatMessage }) {
  if (m.isSystem) {
    return (
      <div className="my-2 flex justify-center">
        <span className="rounded-full border border-gold/30 bg-black/60 px-4 py-1.5 font-body text-[11px] tracking-elegant text-gold">
          {m.body}
        </span>
      </div>
    );
  }
  return (
    <div className={cn("flex", m.mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-4 py-2.5 transition-opacity duration-base sm:max-w-[70%]",
          m.mine
            ? "rounded-br-md bg-crimson/90 text-ivory"
            : "rounded-bl-md border border-charcoal bg-rich-black text-ivory",
          (m.pending || m.failed) && "opacity-60",
        )}
      >
        {m.kind === "voice" && m.voiceUrl ? (
          <VoiceBubble url={m.voiceUrl} durationSec={m.durationSec} mine={m.mine} />
        ) : (
          <span className="font-body text-sm leading-relaxed whitespace-pre-wrap">{m.body}</span>
        )}
        <div className="mt-1 flex items-center justify-end gap-1.5">
          <span className="font-body text-[10px] text-ivory/50">
            {m.failed ? "Failed" : m.pending ? "Queued" : clock(m.createdAt)}
          </span>
          {m.mine && !m.pending && !m.failed && m.readAt && (
            <span className="font-body text-[10px] text-ivory/50">· Read</span>
          )}
        </div>
      </div>
    </div>
  );
}

type Props = {
  matchId: string;
  conversation: Conversation | undefined;
  onBack: () => void;
};

/** One conversation: fixed header, scrolling transcript, pinned composer. */
export function ChatThread({ matchId, conversation, onBack }: Props) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [queued, setQueued] = useState<ChatMessage[]>([]);
  const [peerTyping, setPeerTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const [showIcebreakers, setShowIcebreakers] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const typingSentAt = useRef(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAt = useRef(0);

  const { data, isLoading } = useQuery({
    queryKey: ["messages", matchId],
    queryFn: () => getMessages(matchId),
  });

  const icebreakersQ = useQuery({
    queryKey: ["icebreakers", matchId],
    queryFn: () => getIcebreakers(matchId),
    enabled: showIcebreakers,
    staleTime: Infinity,
  });

  const messages = data?.messages ?? [];
  const all = [...messages, ...queued];

  // Live updates for this thread.
  useRealtime((event) => {
    if (event.type === "notification" || event.matchId !== matchId) return;
    if (event.type === "typing") {
      setPeerTyping(true);
      setTimeout(() => setPeerTyping(false), 3000);
    }
    if (event.type === "message" || event.type === "read" || event.type === "reveal") {
      void queryClient.invalidateQueries({ queryKey: ["messages", matchId] });
    }
  });

  // Mark read on open and whenever new messages land.
  useEffect(() => {
    void markConversationRead(matchId).then(() =>
      queryClient.invalidateQueries({ queryKey: ["conversations"] }),
    );
  }, [matchId, messages.length, queryClient]);

  // Restore anything stranded in the outbox, and flush on reconnect.
  useEffect(() => {
    setQueued(
      pendingFor(matchId).map((q) => ({
        id: q.id,
        matchId,
        kind: "text" as const,
        body: q.body,
        mine: true,
        isSystem: false,
        voiceUrl: null,
        durationSec: 0,
        readAt: null,
        createdAt: new Date(q.queuedAt).toISOString(),
        pending: true,
      })),
    );
    return watchConnectivity((n) => {
      toast(`${n} queued message${n === 1 ? "" : "s"} sent`, "success");
      setQueued([]);
      void queryClient.invalidateQueries({ queryKey: ["messages", matchId] });
    });
  }, [matchId, queryClient]);

  // Keep the transcript pinned to the newest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [all.length, peerTyping]);

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setDraft("");
    setSending(true);
    try {
      await sendMessage(matchId, body);
      await queryClient.invalidateQueries({ queryKey: ["messages", matchId] });
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    } catch (err) {
      // Offline or server unreachable — queue it rather than lose it.
      const item = enqueue(matchId, body);
      setQueued((q) => [
        ...q,
        {
          id: item.id,
          matchId,
          kind: "text",
          body,
          mine: true,
          isSystem: false,
          voiceUrl: null,
          durationSec: 0,
          readAt: null,
          createdAt: new Date().toISOString(),
          pending: true,
        },
      ]);
      toast(err instanceof ApiError ? "Saved — will send when you're back" : "Queued for delivery", "info");
      void flush().then((n) => {
        if (n > 0) {
          setQueued([]);
          void queryClient.invalidateQueries({ queryKey: ["messages", matchId] });
        }
      });
    } finally {
      setSending(false);
    }
  };

  const onDraftChange = (value: string) => {
    setDraft(value);
    // Throttle typing pings to one every 2s.
    if (Date.now() - typingSentAt.current > 2000) {
      typingSentAt.current = Date.now();
      void sendTypingSignal(matchId).catch(() => undefined);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      startedAt.current = Date.now();
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const raw = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        const wav = await blobToWav(raw).catch(() => raw);
        const seconds = Math.round((Date.now() - startedAt.current) / 1000);
        try {
          await sendVoiceNote(matchId, wav, seconds);
          await queryClient.invalidateQueries({ queryKey: ["messages", matchId] });
          void queryClient.invalidateQueries({ queryKey: ["conversations"] });
        } catch {
          toast("Could not send voice note", "error");
        }
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch {
      toast("Microphone unavailable", "error");
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  const veiled = (conversation?.revealLevel ?? 2) > 0;

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      {/* Header — fixed */}
      <header className="flex shrink-0 items-center gap-3 border-b border-charcoal bg-black/90 px-4 py-3 backdrop-blur">
        <IconButton label="Back to conversations" className="lg:hidden" onPress={onBack}>
          <ChevronLeftIcon size={20} />
        </IconButton>
        <Avatar
          name={conversation?.displayName ?? conversation?.firstInitial ?? "?"}
          size="sm"
          ring="gold"
          blurred={veiled}
        />
        <Stack gap={0} className="min-w-0 flex-1">
          <Text variant="body" className="truncate">
            {conversation?.displayName ?? `${conversation?.firstInitial ?? "?"}·`}
          </Text>
          <Text variant="caption" tone="dim" className="truncate">
            {peerTyping ? "typing…" : veiled ? "Veiled — depth lifts the blur" : "Revealed"}
          </Text>
        </Stack>
        {veiled && <EyeOffIcon size={16} className="shrink-0 text-ivory-dim" />}
        <IconButton label="Report or block" onPress={() => setReportOpen(true)}>
          <ShieldIcon size={18} />
        </IconButton>
      </header>

      {/* Transcript — the only scrolling region */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner size={28} />
          </div>
        ) : all.length === 0 ? (
          <Stack gap={4} className="mx-auto max-w-sm items-center py-10 text-center">
            <SparkIcon size={28} className="text-gold" />
            <Text variant="caption" tone="dim">
              No words yet. Say something only you would say.
            </Text>
            {!showIcebreakers ? (
              <Button size="sm" variant="outline" onPress={() => setShowIcebreakers(true)}>
                Need a spark?
              </Button>
            ) : icebreakersQ.isLoading ? (
              <Spinner size={20} />
            ) : (
              <Stack gap={2} className="w-full">
                {(icebreakersQ.data?.icebreakers ?? []).map((line) => (
                  <button
                    key={line}
                    type="button"
                    onClick={() => setDraft(line)}
                    className="cursor-pointer rounded-xl border border-charcoal bg-rich-black px-4 py-3 text-left font-body text-xs leading-relaxed text-ivory-dim transition-colors duration-base hover:border-gold hover:text-ivory"
                  >
                    {line}
                  </button>
                ))}
              </Stack>
            )}
          </Stack>
        ) : (
          <Stack gap={2}>
            {all.map((m) => (
              <Bubble key={m.id} m={m} />
            ))}
            {peerTyping && (
              <div className="flex justify-start">
                <span className="rounded-2xl rounded-bl-md border border-charcoal bg-rich-black px-4 py-2.5 font-body text-sm text-ivory-dim">
                  …
                </span>
              </div>
            )}
          </Stack>
        )}
      </div>

      {/* Composer — pinned */}
      <div className="shrink-0 border-t border-charcoal bg-black px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            rows={1}
            placeholder={recording ? "Recording…" : "Say something real"}
            disabled={recording}
            className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-charcoal bg-rich-black px-4 py-3 font-body text-sm text-ivory outline-none transition-colors duration-base placeholder:text-ivory-dim/50 focus:border-gold"
          />
          {draft.trim() ? (
            <IconButton label="Send" variant="solid" size="lg" onPress={() => void send()} disabled={sending}>
              <ArrowRightIcon size={20} />
            </IconButton>
          ) : recording ? (
            <IconButton label="Stop recording" variant="solid" size="lg" onPress={stopRecording}>
              <CloseIcon size={20} />
            </IconButton>
          ) : (
            <IconButton label="Record voice note" variant="outline" size="lg" onPress={() => void startRecording()}>
              <MicIcon size={20} />
            </IconButton>
          )}
        </div>
      </div>

      {conversation?.userId && (
        <ReportSheet
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          reportedUserId={conversation.userId}
          matchId={matchId}
          onReported={onBack}
        />
      )}
    </div>
  );
}
