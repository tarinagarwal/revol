import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/cn";
import { Drawer, EmptyState, IconButton, Spinner, Stack, Text } from "@/components/ui";
import { BellIcon, HeartIcon, ChatIcon, EyeIcon, SparkIcon, CloseIcon } from "@/components/icons";
import { getNotifications, markNotificationsRead, type AppNotification } from "./notifications.api";

const iconFor = {
  match: HeartIcon,
  message: ChatIcon,
  reveal: EyeIcon,
  event: SparkIcon,
  system: BellIcon,
} as const;

function ago(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h`;
  return `${Math.floor(mins / 1440)}d`;
}

/** Bell + slide-over list. Live updates arrive via the shared SSE stream. */
export function NotificationCenter({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["notifications"], queryFn: getNotifications });

  const items = data?.notifications ?? [];

  const openItem = async (n: AppNotification) => {
    await markNotificationsRead(n.id).catch(() => undefined);
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    onOpenChange(false);
    if (n.link) void navigate(n.link);
  };

  const markAll = async () => {
    await markNotificationsRead().catch(() => undefined);
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  return (
    <Drawer open={open} onClose={() => onOpenChange(false)}>
      <Stack gap={5} className="min-h-0 flex-1">
        <div className="flex shrink-0 items-center justify-between">
          <Text variant="label" tone="gold">
            Notifications
          </Text>
          <div className="flex items-center gap-1">
            {items.some((n) => !n.readAt) && (
              <button
                type="button"
                onClick={() => void markAll()}
                className="cursor-pointer border-none bg-transparent p-0 font-body text-[10px] tracking-elegant uppercase text-ivory-dim transition-colors duration-base hover:text-gold"
              >
                Mark all read
              </button>
            )}
            <IconButton label="Close notifications" onPress={() => onOpenChange(false)}>
              <CloseIcon size={18} />
            </IconButton>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner size={24} />
            </div>
          ) : items.length === 0 ? (
            <EmptyState icon={<BellIcon size={32} />} title="All quiet" description="Matches, messages and reveals land here." />
          ) : (
            <Stack gap={2}>
              {items.map((n) => {
                const Icon = iconFor[n.type] ?? BellIcon;
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => void openItem(n)}
                    className={cn(
                      "flex w-full cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 text-left",
                      "transition-colors duration-base ease-elegant",
                      n.readAt ? "border-transparent hover:bg-charcoal/30" : "border-gold/30 bg-gold/5",
                    )}
                  >
                    <Icon size={16} className={cn("mt-0.5 shrink-0", n.readAt ? "text-ivory-dim" : "text-gold")} />
                    <Stack gap={1} className="min-w-0 flex-1">
                      <Text variant="caption" className="truncate">
                        {n.title}
                      </Text>
                      {n.body && (
                        <Text variant="caption" tone="dim" className="line-clamp-2">
                          {n.body}
                        </Text>
                      )}
                    </Stack>
                    <Text variant="caption" tone="dim" className="shrink-0">
                      {ago(n.createdAt)}
                    </Text>
                  </button>
                );
              })}
            </Stack>
          )}
        </div>
      </Stack>
    </Drawer>
  );
}

/** Bell trigger with unread badge, for the app shell. */
export function NotificationBell({ onOpen }: { onOpen: () => void }) {
  const { data } = useQuery({ queryKey: ["notifications"], queryFn: getNotifications });
  const unread = data?.unread ?? 0;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
      className="relative cursor-pointer border-none bg-transparent p-2 text-ivory-dim outline-none transition-colors duration-base hover:text-ivory focus-visible:ring-2 focus-visible:ring-gold/70"
    >
      <BellIcon size={20} />
      {unread > 0 && (
        <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-crimson px-1 font-body text-[9px] text-ivory">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </button>
  );
}
