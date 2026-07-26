import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AppHeader,
  BlurImage,
  Button,
  Card,
  ChemistryRing,
  Chip,
  Divider,
  EmptyState,
  Heading,
  ProgressBar,
  Reveal,
  Row,
  Spinner,
  Stack,
  Text,
  VoicePlayer,
} from "@/components/ui";
import { ChatIcon, EyeOffIcon, EyeIcon, SparkIcon, InfinityIcon } from "@/components/icons";
import { getMatchDetail } from "@/features/matches/matches.api";

const revealCopy: Record<number, string> = {
  3: "Fully veiled",
  2: "Mutual — the first veil lifted",
  1: "Almost there — keep talking",
  0: "Revealed",
};

/** /app/matches/:id — one story, its chemistry, and the road to the reveal. */
export function MatchDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({
    queryKey: ["match", id],
    queryFn: () => getMatchDetail(id!),
    enabled: !!id,
  });

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
        title="Story not found"
        description="This match may have ended."
        action={
          <Button size="sm" variant="outline" onPress={() => void navigate("/app/matches")}>
            Back to matches
          </Button>
        }
      />
    );
  }

  const m = data.match;
  const p = m.person;
  const revealProgress = ((3 - m.revealLevel) / 3) * 100;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <AppHeader title={`${p.displayName ?? `${p.firstInitial}·`}, ${p.age}`} showBack />
      <div className="grid grid-cols-1 gap-6 px-5 py-6 md:grid-cols-[minmax(0,380px)_1fr] md:items-start">
        {/* Left — the person */}
        <Stack gap={5} className="md:sticky md:top-8">
          <Reveal>
            <div className="relative">
              {p.photoUrl ? (
                <BlurImage src={p.photoUrl} alt="Match portrait" blurLevel={m.revealLevel} aspect="portrait" />
              ) : (
                <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-charcoal bg-rich-black">
                  <EyeOffIcon size={32} className="text-ivory-dim" />
                  <Text variant="caption" tone="dim">
                    No photo — pure mystery
                  </Text>
                </div>
              )}
            </div>
          </Reveal>
          <Reveal delay={100}>
            <Card>
              <Stack gap={3}>
                <Row gap={2}>
                  {m.revealLevel === 0 ? (
                    <EyeIcon size={16} className="text-gold" />
                  ) : (
                    <EyeOffIcon size={16} className="text-gold" />
                  )}
                  <Text variant="label" tone="gold">
                    The reveal
                  </Text>
                </Row>
                <ProgressBar value={revealProgress} />
                <Text variant="caption" tone="dim">
                  {revealCopy[m.revealLevel]}. Real conversation lifts the blur — depth, not volume.
                </Text>
              </Stack>
            </Card>
          </Reveal>
          {p.voiceUrl && (
            <Reveal delay={160}>
              <VoicePlayer url={p.voiceUrl} title="Their voice" subtitle="Heard before seen" variant="gold" />
            </Reveal>
          )}
          <Reveal delay={220}>
            <Button fullWidth disabled>
              <ChatIcon size={16} />
              Conversation opens with Epic 8
            </Button>
          </Reveal>
        </Stack>

        {/* Right — the chemistry + substance */}
        <Stack gap={5}>
          <Reveal delay={120}>
            <Card variant="gold">
              <Row gap={6}>
                <ChemistryRing score={m.compatibility.score} />
                <Stack gap={2} className="min-w-0 flex-1">
                  <Heading level={4} className="italic leading-snug">
                    "{m.compatibility.vibe}"
                  </Heading>
                  <Text variant="caption" tone="dim">
                    Matched {new Date(m.matchedAt).toLocaleDateString()}
                  </Text>
                </Stack>
              </Row>
              <Divider className="my-4" />
              <Stack gap={3}>
                {m.compatibility.reasons.map((r, i) => (
                  <Row key={i} gap={3} className="items-start">
                    <SparkIcon size={15} className="mt-0.5 shrink-0 text-gold" />
                    <Text variant="caption" tone="dim" className="leading-relaxed">
                      {r}
                    </Text>
                  </Row>
                ))}
                {m.compatibility.friction && (
                  <Row gap={3} className="items-start">
                    <InfinityIcon size={15} className="mt-0.5 shrink-0 text-crimson/70" />
                    <Text variant="caption" tone="dim" className="leading-relaxed italic">
                      {m.compatibility.friction}
                    </Text>
                  </Row>
                )}
              </Stack>
            </Card>
          </Reveal>

          <Reveal delay={200}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {p.prompts.map((pr) => (
                <Card key={pr.promptId}>
                  <Stack gap={2}>
                    <Text variant="label" tone="gold">
                      {pr.question}
                    </Text>
                    <Text variant="body" className="font-display italic leading-relaxed">
                      {pr.answer}
                    </Text>
                  </Stack>
                </Card>
              ))}
            </div>
          </Reveal>

          <Reveal delay={280}>
            <Card>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Stack gap={3}>
                  <Text variant="label" tone="dim">
                    Holds close
                  </Text>
                  <div className="flex flex-wrap gap-2">
                    {p.values.map((v) => (
                      <Chip key={v} label={v} selected onToggle={() => undefined} />
                    ))}
                  </div>
                </Stack>
                <Stack gap={3}>
                  <Text variant="label" tone="dim">
                    Lit up by
                  </Text>
                  <div className="flex flex-wrap gap-2">
                    {p.interests.map((v) => (
                      <Chip key={v} label={v} selected={false} onToggle={() => undefined} />
                    ))}
                  </div>
                </Stack>
              </div>
            </Card>
          </Reveal>
        </Stack>
      </div>
    </div>
  );
}
