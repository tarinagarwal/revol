import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, Row, Spinner, Stack, Text, Toggle, toast } from "@/components/ui";
import { BellIcon } from "@/components/icons";
import { getNotificationPrefs, updateNotificationPrefs, type NotificationPrefs } from "./notifications.api";
import { ApiError } from "@/lib/api";

/** Epic 12 — per-type notification switches. */
export function NotificationPrefsCard() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["notification-prefs"], queryFn: getNotificationPrefs });
  const [local, setLocal] = useState<NotificationPrefs | null>(null);

  useEffect(() => {
    if (data?.notifications) setLocal(data.notifications);
  }, [data]);

  const save = async (patch: Partial<NotificationPrefs>) => {
    setLocal((p) => (p ? { ...p, ...patch } : p));
    try {
      const res = await updateNotificationPrefs(patch);
      setLocal(res.notifications);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not save", "error");
      void queryClient.invalidateQueries({ queryKey: ["notification-prefs"] });
    }
  };

  if (isLoading || !local) {
    return (
      <Card>
        <div className="flex justify-center py-6">
          <Spinner size={24} />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <Stack gap={5}>
        <Row gap={3}>
          <BellIcon size={18} className="text-gold" />
          <Text variant="label" tone="gold" className="flex-1">
            Notifications
          </Text>
        </Row>
        <Stack gap={4}>
          <Toggle label="New matches" checked={local.matches} onChange={(v) => void save({ matches: v })} />
          <Toggle label="Messages" checked={local.messages} onChange={(v) => void save({ messages: v })} />
          <Toggle label="Reveals" checked={local.reveals} onChange={(v) => void save({ reveals: v })} />
          <Toggle label="Community gatherings" checked={local.events} onChange={(v) => void save({ events: v })} />
        </Stack>
        <Text variant="caption" tone="dim">
          Muted types stop appearing in your notification centre and stop pushing to your devices.
        </Text>
      </Stack>
    </Card>
  );
}
