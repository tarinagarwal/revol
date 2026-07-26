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
  Row,
  Sheet,
  Spinner,
  Stack,
  Text,
  VoicePlayer,
} from "@/components/ui";
import { CameraIcon, ChevronRightIcon, SettingsIcon, SparkIcon } from "@/components/icons";
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
      className="flex w-full cursor-pointer items-center gap-3 border-none bg-transparent px-0 py-3 text-left outline-none"
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
    <Stack gap={6} className="mx-auto w-full max-w-lg px-5 py-8">
      {/* Identity */}
      <Row gap={4}>
        <Avatar name={p.displayName} size="xl" ring="gold" {...(p.photos[0]?.url ? { src: p.photos[0].url } : {})} />
        <Stack gap={1} className="min-w-0 flex-1">
          <Heading level={2} className="truncate">
            {p.displayName}
          </Heading>
          <Text variant="caption" tone="dim">
            {p.age ? `${p.age} · ` : ""}
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

      {/* Photos */}
      <Card onPress={() => void navigate("/app/photos")}>
        <Row gap={4}>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-gold/30 text-gold">
            <CameraIcon size={20} />
          </span>
          <Stack gap={1} className="flex-1">
            <Text variant="body">Photos</Text>
            <Text variant="caption" tone="dim">
              {p.photos.length}/6 — veiled until the reveal
            </Text>
          </Stack>
          <ChevronRightIcon size={18} className="text-ivory-dim" />
        </Row>
      </Card>

      {/* Voice */}
      {p.voiceIntro?.url ? (
        <VoicePlayer
          url={p.voiceIntro.url}
          title="Your voice intro"
          subtitle={p.voiceIntro.transcript ? `"${p.voiceIntro.transcript.slice(0, 60)}..."` : "Heard before seen"}
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

      {/* Editable sections */}
      <Card padded={false} className="px-6 py-2">
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

      {/* Substance preview */}
      <Stack gap={4}>
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
        <div className="flex flex-wrap gap-2">
          {p.values.map((v) => (
            <Chip key={v} label={v} selected onToggle={() => undefined} />
          ))}
          {p.interests.map((v) => (
            <Chip key={v} label={v} selected={false} onToggle={() => undefined} />
          ))}
        </div>
        <Row gap={2} className="justify-center">
          <SparkIcon size={14} className="text-gold" />
          <Text variant="caption" tone="dim">
            Every edit quietly retunes your chemistry matches.
          </Text>
        </Row>
      </Stack>

      {/* Edit sheets — reusing the onboarding steps */}
      <Sheet open={editing === "intent"} onClose={() => setEditing(null)}>
        <Stack gap={4}>
          <Heading level={4}>Your intention</Heading>
          <IntentStep config={config} initial={p.intent} onSaved={closeAndRefresh} />
        </Stack>
      </Sheet>
      <Sheet open={editing === "personality"} onClose={() => setEditing(null)} className="max-h-[85svh] overflow-y-auto">
        <Stack gap={4}>
          <Heading level={4}>How you move through the world</Heading>
          <PersonalityStep config={config} initial={p.personality} onSaved={closeAndRefresh} />
        </Stack>
      </Sheet>
      <Sheet open={editing === "values"} onClose={() => setEditing(null)} className="max-h-[85svh] overflow-y-auto">
        <Stack gap={4}>
          <Heading level={4}>What you hold closest</Heading>
          <ValuesStep config={config} initial={p.values} onSaved={closeAndRefresh} />
        </Stack>
      </Sheet>
      <Sheet open={editing === "interests"} onClose={() => setEditing(null)} className="max-h-[85svh] overflow-y-auto">
        <Stack gap={4}>
          <Heading level={4}>What lights you up</Heading>
          <InterestsStep config={config} initial={p.interests} onSaved={closeAndRefresh} />
        </Stack>
      </Sheet>
      <Sheet open={editing === "prompts"} onClose={() => setEditing(null)} className="max-h-[85svh] overflow-y-auto">
        <Stack gap={4}>
          <Heading level={4}>In your own words</Heading>
          <PromptsStep config={config} initial={p.prompts} onSaved={closeAndRefresh} />
        </Stack>
      </Sheet>
    </Stack>
  );
}
