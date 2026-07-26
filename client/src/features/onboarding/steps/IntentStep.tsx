import { useState } from "react";
import { Button, RadioGroup, Stack, toast } from "@/components/ui";
import { saveIntent, type OnboardingConfig } from "../onboarding.api";
import { ApiError } from "@/lib/api";

type Props = {
  config: OnboardingConfig;
  initial: string | null;
  onSaved: () => void;
};

export function IntentStep({ config, initial, onSaved }: Props) {
  const [intent, setIntent] = useState(initial ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!intent) {
      toast("Choose what you're here for", "error");
      return;
    }
    setSaving(true);
    try {
      await saveIntent(intent);
      onSaved();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not save", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap={8}>
      <RadioGroup
        value={intent}
        onChange={setIntent}
        options={config.intents.map((i) => ({ value: i.id, label: i.label, description: i.description }))}
      />
      <Button fullWidth loading={saving} onPress={() => void submit()}>
        Continue
      </Button>
    </Stack>
  );
}
