import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BlurImage,
  Button,
  Card,
  ChemistryRing,
  Chip,
  Divider,
  EmptyState,
  Heading,
  Reveal,
  Row,
  Spinner,
  Stack,
  Text,
  VoicePlayer,
  toast,
} from "@/components/ui";
import { HeartIcon, CloseIcon, SparkIcon, InfinityIcon, EyeOffIcon } from "@/components/icons";
import { getToday, actOnToday, devRefreshToday, type MatchCard } from "@/features/discovery/discovery.api";
import { ApiError } from "@/lib/api";

const intentLabels: Record<string, string> = {
  "long-term": "Something lasting",
  "slow-discovery": "Slow discovery",
  "open-to-either": "Open to either",
  "friendship-first": "Friendship first",
};

function MatchView({ match, onActed }: { match: MatchCard; onActed: () => void }) {
  const [acting, setActing] = useState<"like" | "pass" | null>(null);
  const c = match.candidate;

  const act = async (action: "like" | "pass") => {
    setActing(action);
    try {
      await actOnToday(action);
      toast(action === "like" ? "Interest sent — the story may begin" : "Passed. Tomorrow brings another.", action === "like" ? "success" : "info");
      onActed();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Something went wrong", "error");
    } finally {
      setActing(null);
    }
  };

  return (
    <Stack gap={6} className="mx-auto w-full max-w-lg px-5 py-8">
      <Reveal>
        <Stack gap={1}>
          <Text variant="label" tone="gold">
            Today's introduction
          </Text>
          <Heading level={2}>
            {c.firstInitial}·, {c.age}
          </Heading>
          <Text variant="caption" tone="dim">
            {c.city}
            {c.intent ? ` · ${intentLabels[c.intent] ?? c.intent}` : ""}
          </Text>
        </Stack>
      </Reveal>

      {/* The veiled portrait */}
      <Reveal delay={120}>
        <div className="relative">
          {c.photoUrl ? (
            <BlurImage src={c.photoUrl} alt="Your match, veiled" blurLevel={match.revealLevel} aspect="portrait" />
          ) : (
            <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-charcoal bg-rich-black">
              <EyeOffIcon size={32} className="text-ivory-dim" />
              <Text variant="caption" tone="dim">
                No photo yet — pure mystery
              </Text>
            </div>
          )}
          {match.revealLevel > 0 && (
            <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full border border-charcoal bg-black/70 px-3 py-1.5 backdrop-blur">
              <EyeOffIcon size={13} className="text-gold" />
              <span className="font-body text-[10px] tracking-elegant uppercase text-ivory-dim">
                Veiled — conversation lifts the blur
              </span>
            </span>
          )}
        </div>
      </Reveal>

      {/* Chemistry */}
      <Reveal delay={240}>
        <Card variant="gold">
          <Row gap={6}>
            <ChemistryRing score={match.compatibility.score} />
            <Stack gap={2} className="min-w-0 flex-1">
              <Text variant="heading" className="italic leading-snug">
                "{match.compatibility.vibe}"
              </Text>
            </Stack>
          </Row>
          <Divider className="my-4" />
          <Stack gap={3}>
            {match.compatibility.reasons.map((r, i) => (
              <Row key={i} gap={3} className="items-start">
                <SparkIcon size={15} className="mt-0.5 shrink-0 text-gold" />
                <Text variant="caption" tone="dim" className="leading-relaxed">
                  {r}
                </Text>
              </Row>
            ))}
            {match.compatibility.friction && (
              <Row gap={3} className="items-start">
                <InfinityIcon size={15} className="mt-0.5 shrink-0 text-crimson/70" />
                <Text variant="caption" tone="dim" className="leading-relaxed italic">
                  {match.compatibility.friction}
                </Text>
              </Row>
            )}
          </Stack>
        </Card>
      </Reveal>

      {/* Heard before seen */}
      {c.voiceUrl && (
        <Reveal delay={320}>
          <VoicePlayer url={c.voiceUrl} title="Their voice" subtitle="Heard before seen" variant="gold" />
        </Reveal>
      )}

      {/* Substance */}
      <Reveal delay={400}>
        <Stack gap={4}>
          {c.prompts.map((p) => (
            <Card key={p.promptId}>
              <Stack gap={2}>
                <Text variant="label" tone="gold">
                  {p.question}
                </Text>
                <Text variant="body" className="font-display italic leading-relaxed">
                  {p.answer}
                </Text>
              </Stack>
            </Card>
          ))}
          <Stack gap={3}>
            <Text variant="label" tone="dim">
              Holds close
            </Text>
            <div className="flex flex-wrap gap-2">
              {c.values.map((v) => (
                <Chip key={v} label={v} selected onToggle={() => undefined} />
              ))}
            </div>
            <Text variant="label" tone="dim" className="mt-2">
              Lit up by
            </Text>
            <div className="flex flex-wrap gap-2">
              {c.interests.map((v) => (
                <Chip key={v} label={v} selected={false} onToggle={() => undefined} />
              ))}
            </div>
          </Stack>
        </Stack>
      </Reveal>

      {/* Actions */}
      {match.status === "pending" ? (
        <Reveal delay={480}>
          <Row gap={4} className="pt-2">
            <Button variant="outline" fullWidth loading={acting === "pass"} onPress={() => void act("pass")}>
              <CloseIcon size={16} />
              Pass
            </Button>
            <Button fullWidth loading={acting === "like"} onPress={() => void act("like")}>
              <HeartIcon size={16} />
              Begin the story
            </Button>
          </Row>
        </Reveal>
      ) : (
        <Card>
          <Text variant="caption" tone="dim" className="text-center">
            {match.status === "liked"
              ? "You reached out. If they feel it too, the conversation opens."
              : "You passed. A new introduction arrives tomorrow."}
          </Text>
        </Card>
      )}
    </Stack>
  );
}

/** /app/today — one meaningful introduction a day. The heart of Revol. */
export function TodayScreen() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["today-match"], queryFn: getToday, staleTime: 60_000 });
  const [refreshing, setRefreshing] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["today-match"] });

  const devRefresh = async () => {
    setRefreshing(true);
    try {
      await devRefreshToday();
      void refresh();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Refresh failed", "error");
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[70svh] flex-col items-center justify-center gap-4">
        <Spinner size={32} />
        <Text variant="caption" tone="dim">
          Reading the chemistry...
        </Text>
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        title="Could not load today"
        description={error instanceof ApiError ? error.message : "Try again in a moment."}
        action={
          <Button size="sm" variant="outline" onPress={() => void refresh()}>
            Retry
          </Button>
        }
      />
    );
  }

  if (!data.match) {
    return (
      <Stack gap={6} className="mx-auto w-full max-w-lg px-5 py-8">
        <EmptyState
          icon={<InfinityIcon size={40} />}
          title="No introduction today"
          description="Revol is still quiet — as more people finish their stories, your daily introduction appears here. Quality over quantity, always."
          action={
            import.meta.env.DEV ? undefined : (
              <Button size="sm" variant="outline" loading={refreshing} onPress={() => void devRefresh()}>
                Check again
              </Button>
            )
          }
        />
      </Stack>
    );
  }

  return <MatchView match={data.match} onActed={() => void refresh()} />;
}
