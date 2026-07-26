import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { cn } from "@/lib/cn";
import { Avatar, EmptyState, Spinner, Stack, Text } from "@/components/ui";
import { ChatIcon, SparkIcon } from "@/components/icons";
import { getConversations, type Conversation } from "@/features/chat/chat.api";
import { useRealtime } from "@/features/chat/useRealtime";
import { ChatThread } from "@/features/chat/ChatThread";

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function ConversationRow({
  c,
  active,
  onSelect,
}: {
  c: Conversation;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-left",
        "transition-colors duration-base ease-elegant",
        active ? "border-charcoal bg-charcoal/50" : "hover:bg-charcoal/30",
      )}
    >
      <Avatar
        name={c.displayName ?? c.firstInitial}
        size="md"
        ring={c.unread > 0 ? "glow" : "none"}
        blurred={c.revealLevel > 0}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate font-body text-sm text-ivory">
            {c.displayName ?? `${c.firstInitial}·`}
          </span>
          <span className="shrink-0 font-body text-[10px] text-ivory-dim">{timeAgo(c.lastMessageAt)}</span>
        </div>
        <span className="truncate font-body text-xs text-ivory-dim">
          {c.lastMessage ?? <span className="italic">Say the first word</span>}
        </span>
      </div>
      {c.unread > 0 && (
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-crimson font-body text-[10px] text-ivory">
          {c.unread}
        </span>
      )}
    </button>
  );
}

/** /app/chat — list + thread. Desktop: two fixed panes. Mobile: one at a time. */
export function ChatScreen() {
  const { matchId } = useParams<{ matchId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["conversations"], queryFn: getConversations });

  // One stream for the whole app section; the thread reads the same events.
  const { connected } = useRealtime((event) => {
    void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    if (event.type === "message") {
      void queryClient.invalidateQueries({ queryKey: ["messages", event.matchId] });
    }
    if (event.type === "reveal") {
      void queryClient.invalidateQueries({ queryKey: ["matches"] });
      void queryClient.invalidateQueries({ queryKey: ["match", event.matchId] });
    }
  });

  const conversations = data?.conversations ?? [];

  // Desktop lands on the first conversation so the pane is never empty.
  useEffect(() => {
    if (!matchId && conversations[0] && window.innerWidth >= 1024) {
      void navigate(`/app/chat/${conversations[0].matchId}`, { replace: true });
    }
  }, [matchId, conversations, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-[70svh] items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <Stack gap={6} className="mx-auto w-full max-w-xl px-5 py-8">
        <EmptyState
          icon={<ChatIcon size={40} />}
          title="Quiet, for now"
          description="Conversations open once a match is mutual. Words first, faces later — that's the Revol way."
        />
      </Stack>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row">
      {/* Conversation list — hidden on mobile once a thread is open */}
      <aside
        className={cn(
          "flex min-h-0 w-full flex-col border-charcoal lg:w-80 lg:shrink-0 lg:border-r",
          matchId ? "hidden lg:flex" : "flex",
        )}
      >
        <div className="flex shrink-0 items-center justify-between px-4 pt-5 pb-3">
          <Text variant="label" tone="gold">
            Conversations
          </Text>
          <span className="flex items-center gap-1.5" title={connected ? "Live" : "Reconnecting"}>
            <span
              className={cn(
                "size-1.5 rounded-full transition-colors duration-slow",
                connected ? "bg-gold" : "bg-charcoal",
              )}
            />
            <Text variant="caption" tone="dim">
              {connected ? "Live" : "Offline"}
            </Text>
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          <Stack gap={1}>
            {conversations.map((c) => (
              <ConversationRow
                key={c.matchId}
                c={c}
                active={c.matchId === matchId}
                onSelect={() => void navigate(`/app/chat/${c.matchId}`)}
              />
            ))}
          </Stack>
        </div>
      </aside>

      {/* Thread */}
      <section className={cn("min-h-0 flex-1", matchId ? "flex" : "hidden lg:flex")}>
        {matchId ? (
          <ChatThread
            matchId={matchId}
            conversation={conversations.find((c) => c.matchId === matchId)}
            onBack={() => void navigate("/app/chat")}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <SparkIcon size={32} className="text-ivory-dim" />
            <Text variant="caption" tone="dim">
              Choose a conversation
            </Text>
          </div>
        )}
      </section>
    </div>
  );
}
