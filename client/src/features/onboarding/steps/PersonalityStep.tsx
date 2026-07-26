import { useState } from "react";
import { Button, Scale, Stack, toast } from "@/components/ui";
import { savePersonality, type OnboardingConfig } from "../onboarding.api";
import { ApiError } from "@/lib/api";

type Props = {
  config: OnboardingConfig;
  initial: Record<string, number> | null;
  onSaved: () => void;
};

export function PersonalityStep({ config, initial, onSaved }: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>(initial ?? {});
  const [saving, setSaving] = useState(false);
  const remaining = config.personalityQuestions.filter((q) => answers[q.id] === undefined).length;

  const submit = async () => {
    if (remaining > 0) {
      toast(`${remaining} left to answer`, "error");
      return;
    }
    setSaving(true);
    try {
      await savePersonality(answers);
      onSaved();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not save", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap={4}>
      {config.personalityQuestions.map((q) => (
        <Scale
          key={q.id}
          statement={q.text}
          low={q.low}
          high={q.high}
          value={answers[q.id] ?? null}
          onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
        />
      ))}
      <Button fullWidth loading={saving} onPress={() => void submit()} className="mt-4">
        {remaining > 0 ? `${remaining} remaining` : "Continue"}
      </Button>
    </Stack>
  );
}
