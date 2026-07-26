import { useState } from "react";
import { Button, ChipGroup, Input, Select, Stack, Text, toast } from "@/components/ui";
import { saveLifestyle, type OnboardingConfig } from "../onboarding.api";
import { ApiError } from "@/lib/api";

type Lifestyle = {
  heightCm: number | null;
  work: string;
  education: string;
  drinking: string;
  smoking: string;
  kids: string;
  languages: string[];
};

type Props = {
  config: OnboardingConfig;
  initial: Partial<Lifestyle> | null;
  onSaved: () => void;
};

const heights = Array.from({ length: 81 }, (_, i) => ({ value: String(140 + i), label: `${140 + i} cm` }));

/** Optional context that gives the matching engine something concrete. */
export function LifestyleStep({ config, initial, onSaved }: Props) {
  const [state, setState] = useState<Lifestyle>({
    heightCm: initial?.heightCm ?? null,
    work: initial?.work ?? "",
    education: initial?.education ?? "",
    drinking: initial?.drinking ?? "",
    smoking: initial?.smoking ?? "",
    kids: initial?.kids ?? "",
    languages: initial?.languages ?? [],
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await saveLifestyle({
        heightCm: state.heightCm,
        work: state.work.trim(),
        education: state.education,
        drinking: state.drinking,
        smoking: state.smoking,
        kids: state.kids,
        languages: state.languages,
      });
      onSaved();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not save", "error");
    } finally {
      setSaving(false);
    }
  };

  const set = <K extends keyof Lifestyle>(key: K, value: Lifestyle[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  return (
    <Stack gap={6}>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Select
          label="Height"
          placeholder="Prefer not to say"
          options={heights}
          value={state.heightCm ? String(state.heightCm) : ""}
          onChange={(v) => set("heightCm", Number(v))}
        />
        <Input
          label="Work"
          placeholder="What you spend your days on"
          value={state.work}
          onChange={(e) => set("work", e.target.value.slice(0, 80))}
        />
        <Select
          label="Education"
          placeholder="Prefer not to say"
          options={config.education.map((e) => ({ value: e.id, label: e.label }))}
          value={state.education}
          onChange={(v) => set("education", v)}
        />
        <Select
          label="Children"
          placeholder="Prefer not to say"
          options={config.kids.map((k) => ({ value: k.id, label: k.label }))}
          value={state.kids}
          onChange={(v) => set("kids", v)}
        />
        <Select
          label="Drinking"
          placeholder="Prefer not to say"
          options={config.habits.map((h) => ({ value: h.id, label: h.label }))}
          value={state.drinking}
          onChange={(v) => set("drinking", v)}
        />
        <Select
          label="Smoking"
          placeholder="Prefer not to say"
          options={config.habits.map((h) => ({ value: h.id, label: h.label }))}
          value={state.smoking}
          onChange={(v) => set("smoking", v)}
        />
      </div>

      <Stack gap={3}>
        <Text variant="label" tone="dim">
          Languages you speak — up to {config.rules.languages.max}
        </Text>
        <ChipGroup
          options={config.languages}
          selected={state.languages}
          onChange={(v) => set("languages", v)}
          max={config.rules.languages.max}
        />
      </Stack>

      <Stack gap={3}>
        <Button fullWidth loading={saving} onPress={() => void submit()}>
          Continue
        </Button>
        <Text variant="caption" tone="dim" className="text-center">
          All optional — share only what you want seen.
        </Text>
      </Stack>
    </Stack>
  );
}
