import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Avatar,
  Card,
  Chip,
  Divider,
  Heading,
  IconButton,
  ImageFrame,
  Page,
  Row,
  Sheet,
  Spinner,
  Stack,
  Text,
  VerifiedBadge,
  VoicePlayer,
} from "@/components/ui";
import { CameraIcon, ChevronRightIcon, SettingsIcon, SparkIcon, PlusIcon, ShieldIcon } from "@/components/icons";
import { getVerificationStatus } from "@/features/safety/safety.api";
import { getMyProfile } from "@/features/profile/profile.api";
import { getOnboardingConfig } from "@/features/onboarding/onboarding.api";
import { IntentStep } from "@/features/onboarding/steps/IntentStep";
import { PersonalityStep } from "@/features/onboarding/steps/PersonalityStep";
import { ValuesStep } from "@/features/onboarding/steps/ValuesStep";
import { InterestsStep } from "@/features/onboarding/steps/InterestsStep";
import { PromptsStep } from "@/features/onboarding/steps/PromptsStep";

type EditSection = "intent" | "personality" | "values" | "interests" | "prompts" | null;

const intentLabels: Record<string, string> = {
  "long-term": "Something lasting",
  "slow-discovery": "Slow discovery",
  "open-to-either": "Open to either",
  "friendship-first": "Friendship first",
};

/** /app/profile — your story, viewable and editable (edits re-embed matching). */
export function ProfileScreen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<EditSection>(null);

  const profileQ = useQuery({ queryKey: ["my-profile"], queryFn: getMyProfile });
  const configQ = useQuery({ queryKey: ["onboarding-config"], queryFn: getOnboardingConfig, staleTime: Infinity });
  const verificationQ = useQuery({ queryKey: ["verification"], queryFn: getVerificationStatus });
  const verification = verificationQ.data;

  if (profileQ.isLoading || !configQ.data) {
    return (
      <div className="flex min-h-[70svh] items-center justify-center">
        <Spinner size={32} />
      </div>
    );
  }
  const p = profileQ.data?.profile;
  if (!p) return null;
  const config = configQ.data;

  const closeAndRefresh = () => {
    setEditing(null);
    void queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    void queryClient.invalidateQueries({ queryKey: ["onboarding-state"] });
  };

  const sectionRow = (label: string, value: string, section: EditSection) => (
    <button
      type="button"
      onClick={() => setEditing(section)}
      className="flex w-full cursor-pointer items-center gap-3 border-none bg-transparent px-0 py-3.5 text-left outline-none transition-colors duration-base hover:text-gold"
    >
      <Stack gap={1} className="min-w-0 flex-1">
        <Text variant="label" tone="dim">
          {label}
        </Text>
        <Text variant="body" className="truncate">
          {value}
        </Text>
      </Stack>
      <ChevronRightIcon size={16} className="shrink-0 text-ivory-dim" />
    </button>
  );

  return (
    <Page width="full">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,340px)_1fr] lg:items-start">
        {/* Left rail — identity, photos, voice */}
        <Stack gap={5} className="lg:sticky lg:top-8">
          <Card>
            <Stack gap={4}>
              <Row gap={4}>
                <Avatar
                  name={p.displayName}
                  size="xl"
                  ring="gold"
                  {...(p.photos[0]?.url ? { src: p.photos[0].url } : {})}
                />
                <Stack gap={1} className="min-w-0 flex-1">
                  <Row gap={2}>
                    <Heading level={3} className="truncate">
                      {p.displayName}
                    </Heading>
                    {verification?.status === "verified" && <VerifiedBadge />}
                  </Row>
                  <Text variant="caption" tone="dim">
                    {p.age ? `${p.age}` : ""}
                    {p.age && p.city ? " · " : ""}
                    {p.city ?? ""}
                  </Text>
                  {p.intent && (
                    <Text variant="caption" tone="gold">
                      {intentLabels[p.intent] ?? p.intent}
                    </Text>
                  )}
                </Stack>
                <IconButton label="Settings" onPress={() => void navigate("/app/settings")}>
                  <SettingsIcon size={20} />
                </IconButton>
              </Row>
            </Stack>
          </Card>

          {/* Verification */}
          {verification?.status !== "verified" && (
            <Card onPress={() => void navigate("/app/verify")}>
              <Row gap={4}>
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-gold/30 text-gold">
                  <ShieldIcon size={20} />
                </span>
                <Stack gap={1} className="flex-1">
                  <Text variant="body">Verify it's you</Text>
                  <Text variant="caption" tone="dim">
                    A quick selfie earns a verified badge. Matches trust it.
                  </Text>
                </Stack>
                <ChevronRightIcon size={18} className="text-ivory-dim" />
              </Row>
            </Card>
          )}

          {/* Photo strip */}
          <Card>
            <Stack gap={4}>
              <Row gap={3}>
                <CameraIcon size={18} className="text-gold" />
                <Text variant="label" tone="gold" className="flex-1">
                  Photos
                </Text>
                <Text variant="caption" tone="dim">
                  {p.photos.length}/6
                </Text>
              </Row>
              <div className="grid grid-cols-3 gap-2">
                {p.photos.slice(0, 5).map((photo) =>
                  photo.url ? (
                    <ImageFrame key={photo.id} src={photo.url} alt="Your photo" aspect="square" />
                  ) : null,
                )}
                <button
                  type="button"
                  onClick={() => void navigate("/app/photos")}
                  className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-charcoal bg-transparent text-ivory-dim transition-colors duration-base hover:border-gold hover:text-gold"
                >
                  <PlusIcon size={18} />
                  <span className="font-body text-[10px] tracking-elegant uppercase">Manage</span>
                </button>
              </div>
              <Text variant="caption" tone="dim">
                Veiled to others until chemistry earns the reveal.
              </Text>
            </Stack>
          </Card>

          {p.voiceIntro?.url ? (
            <VoicePlayer
              url={p.voiceIntro.url}
              title="Your voice intro"
              subtitle={p.voiceIntro.transcript ? `"${p.voiceIntro.transcript.slice(0, 50)}..."` : "Heard before seen"}
              durationSec={p.voiceIntro.durationSec}
              variant="gold"
            />
          ) : (
            <Card>
              <Text variant="caption" tone="dim" className="text-center">
                No voice intro yet — voices carry chemistry photos can't.
              </Text>
            </Card>
          )}
        </Stack>

        {/* Right rail — the story */}
        <Stack gap={5}>
          <Card padded={false} className="px-5 py-1 sm:px-6">
            {sectionRow("Intent", p.intent ? (intentLabels[p.intent] ?? p.intent) : "Choose", "intent")}
            <Divider />
            {sectionRow("Personality", "Six sliders that shape your matches", "personality")}
            <Divider />
            {sectionRow("Values", p.values.join(" · ") || "Choose", "values")}
            <Divider />
            {sectionRow("Interests", p.interests.join(" · ") || "Choose", "interests")}
            <Divider />
            {sectionRow("Prompts", `${p.prompts.length} answered`, "prompts")}
          </Card>

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

          <Row gap={2} className="justify-center pb-2">
            <SparkIcon size={14} className="text-gold" />
            <Text variant="caption" tone="dim">
              Every edit quietly retunes your chemistry matches.
            </Text>
          </Row>
        </Stack>
      </div>

      {/* Edit dialogs — reusing the onboarding steps */}
      <Sheet open={editing === "intent"} onClose={() => setEditing(null)} title="Your intention">
        <IntentStep config={config} initial={p.intent} onSaved={closeAndRefresh} />
      </Sheet>
      <Sheet
        open={editing === "personality"}
        onClose={() => setEditing(null)}
        title="How you move through the world"
        className="sm:max-w-2xl"
      >
        <PersonalityStep config={config} initial={p.personality} onSaved={closeAndRefresh} />
      </Sheet>
      <Sheet open={editing === "values"} onClose={() => setEditing(null)} title="What you hold closest">
        <ValuesStep config={config} initial={p.values} onSaved={closeAndRefresh} />
      </Sheet>
      <Sheet open={editing === "interests"} onClose={() => setEditing(null)} title="What lights you up" className="sm:max-w-2xl">
        <InterestsStep config={config} initial={p.interests} onSaved={closeAndRefresh} />
      </Sheet>
      <Sheet open={editing === "prompts"} onClose={() => setEditing(null)} title="In your own words" className="sm:max-w-2xl">
        <PromptsStep config={config} initial={p.prompts} onSaved={closeAndRefresh} />
      </Sheet>
    </Page>
  );
}
