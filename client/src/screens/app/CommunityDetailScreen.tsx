import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AppHeader,
  Avatar,
  Button,
  Card,
  Divider,
  EmptyState,
  Input,
  Row,
  Sheet,
  Spinner,
  Stack,
  Text,
  TextArea,
  VerifiedBadge,
  toast,
} from "@/components/ui";
import { PlusIcon, SparkIcon, UserIcon } from "@/components/icons";
import {
  createEvent,
  getCommunity,
  joinCommunity,
  leaveCommunity,
  rsvp,
} from "@/features/community/community.api";
import { ApiError } from "@/lib/api";

/** /app/communities/:id — about, gatherings, members. */
export function CommunityDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [eventOpen, setEventOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", startsAt: "", location: "", capacity: "" });
  const [creating, setCreating] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["community", id],
    queryFn: () => getCommunity(id!),
    enabled: !!id,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["community", id] });
    void queryClient.invalidateQueries({ queryKey: ["communities"] });
    void queryClient.invalidateQueries({ queryKey: ["events"] });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[70svh] items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }
  if (error || !data) {
    return (
      <EmptyState
        title="Community not found"
        description="It may have been archived."
        action={
          <Button size="sm" variant="outline" onPress={() => void navigate("/app/communities")}>
            Back to communities
          </Button>
        }
      />
    );
  }

  const c = data.community;

  const toggleMembership = async () => {
    try {
      if (c.joined) {
        await leaveCommunity(c.id);
        toast("Left the community", "info");
      } else {
        await joinCommunity(c.id);
        toast("Joined", "success");
      }
      refresh();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not update membership", "error");
    }
  };

  const submitEvent = async () => {
    if (form.title.trim().length < 3 || form.description.trim().length < 10 || !form.startsAt || !form.location.trim()) {
      toast("Fill in the title, description, date and place", "error");
      return;
    }
    setCreating(true);
    try {
      await createEvent(c.id, {
        title: form.title.trim(),
        description: form.description.trim(),
        startsAt: new Date(form.startsAt).toISOString(),
        location: form.location.trim(),
        ...(form.capacity ? { capacity: Number(form.capacity) } : {}),
      });
      toast("Gathering created", "success");
      setEventOpen(false);
      setForm({ title: "", description: "", startsAt: "", location: "", capacity: "" });
      refresh();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not create event", "error");
    } finally {
      setCreating(false);
    }
  };

  const setRsvp = async (eventId: string, status: "going" | "interested", current: string | null) => {
    try {
      await rsvp(eventId, current === status ? "not-going" : status);
      refresh();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not RSVP", "error");
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0">
        <AppHeader title={c.name} showBack />
      </div>

      <div className="mx-auto grid w-full min-h-0 max-w-7xl flex-1 grid-cols-1 gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,340px)_1fr] lg:px-8 lg:py-6">
        {/* About + members */}
        <Stack gap={5} className="lg:sticky lg:top-8">
          <Card variant={c.joined ? "gold" : "default"}>
            <Stack gap={4}>
              <Text variant="label" tone="gold">
                {c.topic}
                {c.city ? ` · ${c.city}` : ""}
              </Text>
              <Text variant="caption" tone="dim" className="leading-relaxed">
                {c.description}
              </Text>
              <Divider />
              <Row gap={3}>
                <Text variant="caption" tone="dim" className="flex-1">
                  {c.memberCount} member{c.memberCount === 1 ? "" : "s"}
                  {c.isHost ? " · you host" : ""}
                </Text>
                <Button size="sm" variant={c.joined ? "ghost" : "primary"} onPress={() => void toggleMembership()}>
                  {c.joined ? "Leave" : "Join"}
                </Button>
              </Row>
            </Stack>
          </Card>

          <Card>
            <Stack gap={4}>
              <Row gap={3}>
                <UserIcon size={18} className="text-gold" />
                <Text variant="label" tone="gold" className="flex-1">
                  Members
                </Text>
              </Row>
              <Stack gap={3}>
                {c.members.map((m) => (
                  <Row key={m.userId} gap={3}>
                    <Avatar name={m.displayName} size="sm" />
                    <Text variant="caption" className="flex-1 truncate">
                      {m.displayName}
                    </Text>
                    {m.verified && <VerifiedBadge size={11} />}
                    {m.role === "host" && (
                      <Text variant="caption" tone="gold">
                        host
                      </Text>
                    )}
                  </Row>
                ))}
              </Stack>
            </Stack>
          </Card>
        </Stack>

        {/* Gatherings */}
        <Stack gap={5} className="lg:min-h-0 lg:overflow-y-auto lg:pr-1">
          <Row gap={3}>
            <Text variant="label" tone="gold" className="flex-1">
              Gatherings
            </Text>
            {c.joined && (
              <Button size="sm" variant="outline" onPress={() => setEventOpen(true)}>
                <PlusIcon size={14} />
                Host one
              </Button>
            )}
          </Row>

          {c.events.length === 0 ? (
            <EmptyState
              icon={<SparkIcon size={34} />}
              title="Nothing planned yet"
              description={c.joined ? "Be the one who starts something." : "Join to host or attend gatherings."}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {c.events.map((e) => {
                const when = new Date(e.startsAt);
                return (
                  <Card key={e.id}>
                    <Stack gap={3}>
                      <Text variant="label" tone="gold">
                        {when.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })} ·{" "}
                        {when.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                      <Text variant="heading">{e.title}</Text>
                      <Text variant="caption" tone="dim" className="leading-relaxed">
                        {e.description}
                      </Text>
                      <Text variant="caption" tone="dim">
                        {e.location} · {e.goingCount} going{e.capacity > 0 ? ` of ${e.capacity}` : ""}
                      </Text>
                      <Row gap={2} className="flex-wrap">
                        <Button
                          size="sm"
                          variant={e.myRsvp === "going" ? "gold" : "outline"}
                          onPress={() => void setRsvp(e.id, "going", e.myRsvp)}
                        >
                          {e.myRsvp === "going" ? "Going" : "I'm going"}
                        </Button>
                        <Button
                          size="sm"
                          variant={e.myRsvp === "interested" ? "primary" : "ghost"}
                          onPress={() => void setRsvp(e.id, "interested", e.myRsvp)}
                        >
                          Interested
                        </Button>
                      </Row>
                    </Stack>
                  </Card>
                );
              })}
            </div>
          )}
        </Stack>
      </div>

      {/* Host an event */}
      <Sheet open={eventOpen} onClose={() => setEventOpen(false)} title="Host a gathering">
        <Stack gap={5}>
          <Input
            label="Title"
            placeholder="Sunday matinee + coffee"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value.slice(0, 90) }))}
          />
          <TextArea
            label="What's happening?"
            placeholder="What you'll do, who it's for, anything to bring."
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value.slice(0, 800) }))}
          />
          <Input
            label="When"
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
          />
          <Input
            label="Where"
            placeholder="Venue, area, or 'online'"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value.slice(0, 140) }))}
          />
          <Input
            label="Capacity"
            type="number"
            placeholder="Leave empty for unlimited"
            value={form.capacity}
            onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
          />
          <Button fullWidth loading={creating} onPress={() => void submitEvent()}>
            Create gathering
          </Button>
        </Stack>
      </Sheet>
    </div>
  );
}
