import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BlurImage, Card, EmptyState, Page, PageHeader, Reveal, Row, Spinner, Stack, Text } from "@/components/ui";
import { HeartIcon, EyeOffIcon, ChevronRightIcon, SparkIcon } from "@/components/icons";
import { getMatches } from "@/features/matches/matches.api";

/** /app/matches — mutual stories, newest first. Responsive card grid. */
export function MatchesScreen() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["matches"], queryFn: getMatches });

  if (isLoading) {
    return (
      <div className="flex min-h-[70svh] items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }

  const matches = data?.matches ?? [];

  if (matches.length === 0) {
    return (
      <Stack gap={6} className="mx-auto w-full max-w-xl px-5 py-8">
        <EmptyState
          icon={<HeartIcon size={40} />}
          title="No mutual stories yet"
          description="When someone you reached for reaches back, they appear here — and the conversation begins."
        />
      </Stack>
    );
  }

  return (
    <Page width="full">
      <PageHeader eyebrow="Mutual" title="Your stories" subtitle={`${matches.length} connection${matches.length === 1 ? "" : "s"}`} />
      <Stack gap={6}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {matches.map((m, i) => (
            <Reveal key={m.id} delay={i * 80}>
              <Card padded={false} onPress={() => void navigate(`/app/matches/${m.id}`)} className="overflow-hidden">
                <div className="relative">
                  {m.person.photoUrl ? (
                    <BlurImage
                      src={m.person.photoUrl}
                      alt="Match, veiled"
                      blurLevel={m.revealLevel}
                      aspect="wide"
                      className="rounded-b-none"
                    />
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center rounded-t-2xl bg-rich-black">
                      <EyeOffIcon size={26} className="text-ivory-dim" />
                    </div>
                  )}
                  <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full border border-gold/40 bg-black/70 px-2.5 py-1 backdrop-blur">
                    <SparkIcon size={12} className="text-gold" />
                    <span className="font-body text-[10px] text-gold">{Math.round(m.compatibility.score)}</span>
                  </span>
                </div>
                <div className="p-4">
                  <Row gap={3}>
                    <Stack gap={1} className="min-w-0 flex-1">
                      <Text variant="body">
                        {m.person.displayName ?? `${m.person.firstInitial}·`}, {m.person.age}
                      </Text>
                      <Text variant="caption" tone="dim" className="truncate italic">
                        "{m.compatibility.vibe}"
                      </Text>
                    </Stack>
                    <ChevronRightIcon size={16} className="shrink-0 text-ivory-dim" />
                  </Row>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </Stack>
    </Page>
  );
}
