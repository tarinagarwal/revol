import { useState } from "react";
import { Button, ChipGroup, Input, RadioGroup, Stack, Text, toast } from "@/components/ui";
import { saveBasics, type OnboardingConfig } from "../onboarding.api";
import { ApiError } from "@/lib/api";

const genderLabels: Record<string, string> = {
  woman: "Woman",
  man: "Man",
  nonbinary: "Non-binary",
  other: "Another identity",
};

const interestLabels: Record<string, string> = {
  women: "Women",
  men: "Men",
  nonbinary: "Non-binary people",
  everyone: "Everyone",
};

type Props = {
  config: OnboardingConfig;
  initial: { birthdate: string; gender: string; interestedIn: string[]; city: string } | null;
  onSaved: () => void;
};

export function BasicsStep({ config, initial, onSaved }: Props) {
  const [birthdate, setBirthdate] = useState(initial?.birthdate?.slice(0, 10) ?? "");
  const [gender, setGender] = useState(initial?.gender ?? "");
  const [interestedIn, setInterestedIn] = useState<string[]>(initial?.interestedIn ?? []);
  const [city, setCity] = useState(initial?.city ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!birthdate || !gender || interestedIn.length === 0 || city.trim().length < 2) {
      toast("Fill everything in — it all matters", "error");
      return;
    }
    setSaving(true);
    try {
      await saveBasics({ birthdate, gender, interestedIn, city: city.trim() });
      onSaved();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not save", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap={8}>
      <Input label="Birthday" type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} hint={`You must be ${config.rules.minAge}+. Only your age is ever shown.`} />
      <RadioGroup
        label="I am"
        value={gender}
        onChange={setGender}
        options={config.genders.map((g) => ({ value: g, label: genderLabels[g] ?? g }))}
      />
      <Stack gap={3}>
        <Text variant="label" tone="dim">
          Show me
        </Text>
        <ChipGroup
          options={config.interestedIn.map((i) => interestLabels[i] ?? i)}
          selected={interestedIn.map((i) => interestLabels[i] ?? i)}
          onChange={(labels) =>
            setInterestedIn(config.interestedIn.filter((i) => labels.includes(interestLabels[i] ?? i)))
          }
        />
      </Stack>
      <Input label="City" placeholder="Where your story is set" value={city} onChange={(e) => setCity(e.target.value)} />
      <Button fullWidth loading={saving} onPress={() => void submit()}>
        Continue
      </Button>
    </Stack>
  );
}
