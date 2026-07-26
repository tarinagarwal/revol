import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Heading, ProgressBar, Screen, Spinner, Stack, Text, toast } from "@/components/ui";
import { InfinityHeartIcon, ChevronLeftIcon } from "@/components/icons";
import { IconButton } from "@/components/ui";
import { getOnboardingConfig, getOnboardingState, completeOnboarding } from "@/features/onboarding/onboarding.api";
import { BasicsStep } from "@/features/onboarding/steps/BasicsStep";
import { IntentStep } from "@/features/onboarding/steps/IntentStep";
import { PersonalityStep } from "@/features/onboarding/steps/PersonalityStep";
import { ValuesStep } from "@/features/onboarding/steps/ValuesStep";
import { InterestsStep } from "@/features/onboarding/steps/InterestsStep";
import { PromptsStep } from "@/features/onboarding/steps/PromptsStep";
import { VoiceStep } from "@/features/onboarding/steps/VoiceStep";
import { useAuthStore } from "@/store/authStore";
import { ApiError } from "@/lib/api";

const STEP_TITLES = [
  { title: "Welcome", subtitle: "" },
  { title: "The essentials", subtitle: "A few facts — nothing that gives the mystery away." },
  { title: "Your intention", subtitle: "What are you really here for?" },
  { title: "How you move through the world", subtitle: "Slide toward whichever feels like you." },
  { title: "What you hold closest", subtitle: "Choose 3 to 5 values that define you." },
  { title: "What lights you up", subtitle: "Pick 3 to 8 — the things you could talk about forever." },
  { title: "In your own words", subtitle: "Answer at least two. Make them count." },
  { title: "Your voice", subtitle: "A 60-second intro. Heard before seen — optional, but powerful." },
];

/** Epic 3 — the depth-first wizard. Slow, elegant, one truth at a time. */
export function OnboardingScreen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState<number | null>(null);
  const [finishing, setFinishing] = useState(false);

  const configQ = useQuery({ queryKey: ["onboarding-config"], queryFn: getOnboardingConfig, staleTime: Infinity });
  const stateQ = useQuery({ queryKey: ["onboarding-state"], queryFn: getOnboardingState });

  // Resume where they left off (server owns progress).
  useEffect(() => {
    if (stateQ.data && step === null) {
      if (stateQ.data.completed) {
        void navigate("/app", { replace: true });
        return;
      }
      setStep(Math.min(stateQ.data.step, STEP_TITLES.length - 1));
    }
  }, [stateQ.data, step, navigate]);

  const progress = useMemo(() => (step === null ? 0 : (step / (STEP_TITLES.length - 1)) * 100), [step]);

  if (configQ.isLoading || stateQ.isLoading || step === null) {
    return (
      <Screen centered>
        <Spinner size={32} />
      </Screen>
    );
  }
  if (!configQ.data || !stateQ.data) {
    return (
      <Screen centered>
        <Text tone="dim">Could not load onboarding — refresh to retry.</Text>
      </Screen>
    );
  }

  const config = configQ.data;
  const sections = stateQ.data.sections;
  const advance = () => {
    void queryClient.invalidateQueries({ queryKey: ["onboarding-state"] });
    setStep((s) => Math.min((s ?? 0) + 1, STEP_TITLES.length - 1));
  };

  const finish = async () => {
    setFinishing(true);
    try {
      await completeOnboarding();
      await queryClient.invalidateQueries({ queryKey: ["onboarding-state"] });
      toast("Your story begins", "success");
      void navigate("/app", { replace: true });
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not finish — try again", "error");
    } finally {
      setFinishing(false);
    }
  };

  const meta = STEP_TITLES[step]!;

  return (
    <Screen className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_35%_at_50%_0%,rgb(255_0_46/0.07),transparent_70%)]"
      />

      {/* Stepper header */}
      <div className="relative z-10 mx-auto w-full max-w-xl px-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          {step > 0 ? (
            <IconButton label="Previous step" onPress={() => setStep((s) => Math.max((s ?? 1) - 1, 0))}>
              <ChevronLeftIcon size={20} />
            </IconButton>
          ) : (
            <InfinityHeartIcon size={24} className="text-crimson" />
          )}
          <ProgressBar value={progress} className="flex-1" />
          <Text variant="caption" tone="dim">
            {step}/{STEP_TITLES.length - 1}
          </Text>
        </div>
      </div>

      {/* Step body — keyed so each step blur-reveals in */}
      <div key={step} className="relative z-10 mx-auto w-full max-w-xl flex-1 px-6 py-10 animate-[revol-blur-reveal_0.6s_var(--ease-reveal)]">
        <Stack gap={8}>
          {step > 0 && (
            <Stack gap={2}>
              <Heading level={2}>{meta.title}</Heading>
              {meta.subtitle && (
                <Text variant="caption" tone="dim">
                  {meta.subtitle}
                </Text>
              )}
            </Stack>
          )}

          {step === 0 && (
            <Stack gap={8} className="items-center pt-16 text-center">
              <InfinityHeartIcon size={64} className="text-crimson animate-[revol-float_5s_ease-in-out_infinite]" />
              <Stack gap={3} className="items-center">
                <Heading level={1}>Hey, {user?.displayName}.</Heading>
                <Text variant="body" tone="dim" className="max-w-md leading-relaxed">
                  Before anyone sees you, we learn who you are. Eight quiet minutes — personality, values, intention.
                  The more honest you are, the better the chemistry.
                </Text>
              </Stack>
              <Button size="lg" onPress={advance}>
                Begin
              </Button>
              <Text variant="label" tone="dim">
                No photos judged. No swiping. Just you.
              </Text>
            </Stack>
          )}

          {step === 1 && <BasicsStep config={config} initial={sections.basics} onSaved={advance} />}
          {step === 2 && <IntentStep config={config} initial={sections.intent} onSaved={advance} />}
          {step === 3 && <PersonalityStep config={config} initial={sections.personality} onSaved={advance} />}
          {step === 4 && <ValuesStep config={config} initial={sections.values} onSaved={advance} />}
          {step === 5 && <InterestsStep config={config} initial={sections.interests} onSaved={advance} />}
          {step === 6 && <PromptsStep config={config} initial={sections.prompts} onSaved={advance} />}
          {step === 7 && (
            <VoiceStep initial={sections.voiceIntro} onDone={() => void finish()} finishing={finishing} />
          )}
        </Stack>
      </div>
    </Screen>
  );
}
