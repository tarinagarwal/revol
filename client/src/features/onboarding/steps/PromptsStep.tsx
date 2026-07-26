import { useState } from "react";
import { Button, Chip, Stack, Text, TextArea, toast } from "@/components/ui";
import { savePrompts, type OnboardingConfig } from "../onboarding.api";
import { ApiError } from "@/lib/api";

type Props = {
  config: OnboardingConfig;
  initial: { promptId: string; question: string; answer: string }[] | null;
  onSaved: () => void;
};

export function PromptsStep({ config, initial, onSaved }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>(
    Object.fromEntries((initial ?? []).map((p) => [p.promptId, p.answer])),
  );
  const [selected, setSelected] = useState<string[]>((initial ?? []).map((p) => p.promptId));
  const [saving, setSaving] = useState(false);
  const { min, max, maxAnswerLength } = config.rules.prompts;

  const togglePrompt = (id: string) => {
    if (selected.includes(id)) {
      setSelected((s) => s.filter((p) => p !== id));
    } else if (selected.length < max) {
      setSelected((s) => [...s, id]);
    } else {
      toast(`Up to ${max} prompts`, "info");
    }
  };

  const submit = async () => {
    const filled = selected
      .map((id) => ({ promptId: id, answer: (answers[id] ?? "").trim() }))
      .filter((p) => p.answer.length >= 3);
    if (filled.length < min) {
      toast(`Answer at least ${min} prompts`, "error");
      return;
    }
    setSaving(true);
    try {
      await savePrompts(filled);
      onSaved();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not save", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap={8}>
      <div className="flex flex-wrap gap-2">
        {config.prompts.map((p) => (
          <Chip key={p.id} label={p.question} selected={selected.includes(p.id)} onToggle={() => togglePrompt(p.id)} />
        ))}
      </div>
      <Stack gap={6}>
        {selected.map((id) => {
          const prompt = config.prompts.find((p) => p.id === id);
          if (!prompt) return null;
          return (
            <Stack key={id} gap={2}>
              <TextArea
                label={prompt.question}
                placeholder="Say it like only you would..."
                rows={3}
                value={answers[id] ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [id]: e.target.value.slice(0, maxAnswerLength) }))}
              />
              <Text variant="caption" tone="dim" className="text-right">
                {(answers[id] ?? "").length}/{maxAnswerLength}
              </Text>
            </Stack>
          );
        })}
      </Stack>
      <Button fullWidth loading={saving} onPress={() => void submit()}>
        Continue
      </Button>
    </Stack>
  );
}
