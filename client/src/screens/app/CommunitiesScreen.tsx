import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Input,
  Page,
  PageHeader,
  Reveal,
  Row,
  Sheet,
  Select,
  Spinner,
  Stack,
  Text,
  TextArea,
  toast,
} from "@/components/ui";
import { PlusIcon, SearchIcon, SparkIcon, HeartIcon, ChevronRightIcon } from "@/components/icons";
import {
  createCommunity,
  getCommunities,
  getEvents,
  getTopics,
  joinCommunity,
  rsvp,
  type CommunityEvent,
} from "@/features/community/community.api";
import { ApiError } from "@/lib/api";

function EventRow({ event, onChanged }: { event: CommunityEvent; onChanged: () => void }) {
  const navigate = useNavigate();
  const when = new Date(event.startsAt);
  const setRsvp = async (status: "going" | "interested") => {
    try {
      await rsvp(event.id, event.myRsvp === status ? "not-going" : status);
      onChanged();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not RSVP", "error");
    }
  };
  return (
    <Card>
      <Stack gap={3}>
        <Row gap={3} className="items-start">
          <Stack gap={1} className="min-w-0 flex-1">
            <Text variant="label" tone="gold">
              {when.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })} ·{" "}
              {when.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
            <Text variant="body" className="truncate">
              {event.title}
            </Text>
            <Text variant="caption" tone="dim" className="truncate">
              {event.location}
              {event.communityName ? ` · ${event.communityName}` : ""}
            </Text>
          </Stack>
          {event.communityId && (
            <button
              type="button"
              onClick={() => void navigate(`/app/communities/${event.communityId}`)}
              aria-label="Open community"
              className="cursor-pointer border-none bg-transparent p-0 text-ivory-dim transition-colors duration-base hover:text-gold"
            >
              <ChevronRightIcon size={18} />
            </button>
          )}
        </Row>
        <Row gap={2} className="flex-wrap">
          <Button size="sm" variant={event.myRsvp === "going" ? "gold" : "outline"} onPress={() => void setRsvp("going")}>
            {event.myRsvp === "going" ? "Going" : "I'm going"}
          </Button>
          <Button
            size="sm"
            variant={event.myRsvp === "interested" ? "primary" : "ghost"}
            onPress={() => void setRsvp("interested")}
          >
            Interested
          </Button>
          <Text variant="caption" tone="dim">
            {event.goingCount} going{event.capacity > 0 ? ` · ${event.capacity} max` : ""}
          </Text>
        </Row>
      </Stack>
    </Card>
  );
}

/** /app/communities — browse, join, and see what's happening. */
export function CommunitiesScreen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [topic, setTopic] = useState("");
  const [q, setQ] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", topic: "", city: "" });
  const [creating, setCreating] = useState(false);

  const topicsQ = useQuery({ queryKey: ["community-topics"], queryFn: getTopics, staleTime: Infinity });
  const listQ = useQuery({
    queryKey: ["communities", topic, q],
    queryFn: () => getCommunities({ ...(topic ? { topic } : {}), ...(q ? { q } : {}) }),
  });
  const eventsQ = useQuery({ queryKey: ["events", "mine"], queryFn: () => getEvents("mine") });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["communities"] });
    void queryClient.invalidateQueries({ queryKey: ["events"] });
  };

  const join = async (id: string) => {
    try {
      await joinCommunity(id);
      toast("Joined", "success");
      refresh();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not join", "error");
    }
  };

  const submitCreate = async () => {
    if (form.name.trim().length < 3 || form.description.trim().length < 10 || !form.topic) {
      toast("Give it a name, a topic and a little description", "error");
      return;
    }
    setCreating(true);
    try {
      const res = await createCommunity({
        name: form.name.trim(),
        description: form.description.trim(),
        topic: form.topic,
        ...(form.city.trim() ? { city: form.city.trim() } : {}),
      });
      toast("Community created", "success");
      setCreateOpen(false);
      setForm({ name: "", description: "", topic: "", city: "" });
      refresh();
      void navigate(`/app/communities/${res.id}`);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not create", "error");
    } finally {
      setCreating(false);
    }
  };

  const communities = listQ.data?.communities ?? [];
  const events = eventsQ.data?.events ?? [];

  return (
    <Page width="full">
      <PageHeader
        eyebrow="Community"
        title="Find your people"
        subtitle="Shared rooms and real gatherings — connection beyond the daily introduction."
        actions={
          <Button size="sm" onPress={() => setCreateOpen(true)}>
            <PlusIcon size={16} />
            Create
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_minmax(0,340px)] lg:items-start">
        {/* Browse */}
        <Stack gap={5}>
          <Row gap={3} className="flex-wrap">
            <Input
              placeholder="Search communities"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              leading={<SearchIcon size={16} />}
              className="max-w-xs flex-1"
            />
          </Row>

          <div className="flex flex-wrap gap-2">
            <Chip label="All" selected={topic === ""} onToggle={() => setTopic("")} />
            {(topicsQ.data?.topics ?? []).map((t) => (
              <Chip
                key={t}
                label={t.charAt(0).toUpperCase() + t.slice(1)}
                selected={topic === t}
                onToggle={() => setTopic(topic === t ? "" : t)}
              />
            ))}
          </div>

          {listQ.isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner size={28} />
            </div>
          ) : communities.length === 0 ? (
            <EmptyState
              icon={<SparkIcon size={36} />}
              title="Nothing here yet"
              description="Be the first to start a community around something you love."
              action={
                <Button size="sm" variant="outline" onPress={() => setCreateOpen(true)}>
                  Create one
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {communities.map((c, i) => (
                <Reveal key={c.id} delay={i * 60}>
                  <Card className="flex h-full flex-col">
                    <Stack gap={3} className="flex-1">
                      <Row gap={2}>
                        <Text variant="label" tone="gold" className="flex-1 truncate">
                          {c.topic}
                        </Text>
                        <Text variant="caption" tone="dim">
                          {c.memberCount} member{c.memberCount === 1 ? "" : "s"}
                        </Text>
                      </Row>
                      <Text variant="heading" className="truncate">
                        {c.name}
                      </Text>
                      <Text variant="caption" tone="dim" className="line-clamp-3 flex-1 leading-relaxed">
                        {c.description}
                      </Text>
                      <Row gap={2}>
                        {c.joined ? (
                          <Button
                            size="sm"
                            variant="outline"
                            fullWidth
                            onPress={() => void navigate(`/app/communities/${c.id}`)}
                          >
                            Open
                          </Button>
                        ) : (
                          <>
                            <Button size="sm" fullWidth onPress={() => void join(c.id)}>
                              <HeartIcon size={14} />
                              Join
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onPress={() => void navigate(`/app/communities/${c.id}`)}
                            >
                              View
                            </Button>
                          </>
                        )}
                      </Row>
                    </Stack>
                  </Card>
                </Reveal>
              ))}
            </div>
          )}
        </Stack>

        {/* Upcoming */}
        <Stack gap={4} className="lg:sticky lg:top-8">
          <Text variant="label" tone="gold">
            Your upcoming
          </Text>
          {eventsQ.isLoading ? (
            <Spinner size={22} />
          ) : events.length === 0 ? (
            <Card>
              <Text variant="caption" tone="dim" className="text-center">
                Join a community to see its gatherings here.
              </Text>
            </Card>
          ) : (
            <Stack gap={3}>
              {events.slice(0, 6).map((e) => (
                <EventRow key={e.id} event={e} onChanged={refresh} />
              ))}
            </Stack>
          )}
        </Stack>
      </div>

      {/* Create community */}
      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="Start a community">
        <Stack gap={5}>
          <Input
            label="Name"
            placeholder="Sunday Film Club"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value.slice(0, 60) }))}
          />
          <Select
            label="Topic"
            placeholder="Choose a topic"
            options={(topicsQ.data?.topics ?? []).map((t) => ({
              value: t,
              label: t.charAt(0).toUpperCase() + t.slice(1),
            }))}
            value={form.topic}
            onChange={(v) => setForm((f) => ({ ...f, topic: v }))}
          />
          <Input
            label="City"
            placeholder="Optional"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value.slice(0, 80) }))}
          />
          <TextArea
            label="What is it about?"
            placeholder="Who it's for, and what you'll do together."
            rows={4}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value.slice(0, 500) }))}
          />
          <Button fullWidth loading={creating} onPress={() => void submitCreate()}>
            Create community
          </Button>
        </Stack>
      </Sheet>
    </Page>
  );
}
