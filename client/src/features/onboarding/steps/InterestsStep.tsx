import { useState } from "react";
import { Button, ChipGroup, Stack, Text, toast } from "@/components/ui";
import { saveInterests, type OnboardingConfig } from "../onboarding.api";
import { ApiError } from "@/lib/api";

type Props = {
  config: OnboardingConfig;
  initial: string[] | null;
  onSaved: () => void;
};

export function InterestsStep({ config, initial, onSaved }: Props) {
  const [interests, setInterests] = useState<string[]>(initial ?? []);
  const [saving, setSaving] = useState(false);
  const { min, max } = config.rules.interests;

  const submit = async () => {
    if (interests.length < min) {
      toast(`Choose at least ${min}`, "error");
      return;
    }
    setSaving(true);
    try {
      await saveInterests(interests);
      onSaved();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not save", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap={8}>
      <ChipGroup options={config.interests} selected={interests} onChange={setInterests} max={max} />
      <Stack gap={4}>
        <Text variant="caption" tone={interests.length >= min ? "gold" : "dim"} className="text-center">
          {interests.length}/{max} chosen
        </Text>
        <Button fullWidth loading={saving} onPress={() => void submit()}>
          Continue
        </Button>
      </Stack>
    </Stack>
  );
}
