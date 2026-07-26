import { useState } from "react";
import { Button, ChipGroup, Stack, Text, toast } from "@/components/ui";
import { saveValues, type OnboardingConfig } from "../onboarding.api";
import { ApiError } from "@/lib/api";

type Props = {
  config: OnboardingConfig;
  initial: string[] | null;
  onSaved: () => void;
};

export function ValuesStep({ config, initial, onSaved }: Props) {
  const [values, setValues] = useState<string[]>(initial ?? []);
  const [saving, setSaving] = useState(false);
  const { min, max } = config.rules.values;

  const submit = async () => {
    if (values.length < min) {
      toast(`Choose at least ${min}`, "error");
      return;
    }
    setSaving(true);
    try {
      await saveValues(values);
      onSaved();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not save", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap={8}>
      <ChipGroup options={config.values} selected={values} onChange={setValues} max={max} />
      <Stack gap={4}>
        <Text variant="caption" tone={values.length >= min ? "gold" : "dim"} className="text-center">
          {values.length}/{max} chosen
        </Text>
        <Button fullWidth loading={saving} onPress={() => void submit()}>
          Continue
        </Button>
      </Stack>
    </Stack>
  );
}
