import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, ChipGroup, Divider, Row, Select, Spinner, Stack, Text, Toggle, toast } from "@/components/ui";
import { getPreferences, updatePreferences, type Preferences } from "./preferences.api";
import { ApiError } from "@/lib/api";

const INTENT_OPTIONS = [
  { id: "long-term", label: "Something lasting" },
  { id: "slow-discovery", label: "Slow discovery" },
  { id: "open-to-either", label: "Open to either" },
  { id: "friendship-first", label: "Friendship first" },
];

const ages = Array.from({ length: 83 }, (_, i) => ({ value: String(i + 18), label: String(i + 18) }));

/** Epic 6 — discovery preferences. Saves immediately; both sides are enforced. */
export function PreferencesCard() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["preferences"], queryFn: getPreferences });
  const [local, setLocal] = useState<Preferences | null>(null);

  useEffect(() => {
    if (data?.preferences) setLocal(data.preferences);
  }, [data]);

  const save = async (patch: Partial<Preferences>) => {
    setLocal((p) => (p ? { ...p, ...patch } : p));
    try {
      const res = await updatePreferences(patch);
      setLocal(res.preferences);
      void queryClient.invalidateQueries({ queryKey: ["today-match"] });
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not save", "error");
      void queryClient.invalidateQueries({ queryKey: ["preferences"] });
    }
  };

  if (isLoading || !local) {
    return (
      <Card>
        <div className="flex justify-center py-6">
          <Spinner size={24} />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <Stack gap={5}>
        <Text variant="label" tone="gold">
          Who you meet
        </Text>

        <Stack gap={3}>
          <Text variant="caption" tone="dim">
            Age range
          </Text>
          <Row gap={3}>
            <Select
              options={ages}
              value={String(local.ageMin)}
              onChange={(v) => void save({ ageMin: Number(v) })}
              className="flex-1"
            />
            <Text variant="caption" tone="dim">
              to
            </Text>
            <Select
              options={ages}
              value={String(local.ageMax)}
              onChange={(v) => void save({ ageMax: Number(v) })}
              className="flex-1"
            />
          </Row>
        </Stack>

        <Divider />

        <Stack gap={3}>
          <Text variant="caption" tone="dim">
            Location
          </Text>
          <Select
            options={[
              { value: "anywhere", label: "Anywhere" },
              { value: "same", label: "My city only" },
            ]}
            value={local.cityPreference}
            onChange={(v) => void save({ cityPreference: v as "same" | "anywhere" })}
          />
        </Stack>

        <Divider />

        <Stack gap={3}>
          <Text variant="caption" tone="dim">
            Intentions you're open to — none selected means all
          </Text>
          <ChipGroup
            options={INTENT_OPTIONS.map((i) => i.label)}
            selected={local.intents.map((id) => INTENT_OPTIONS.find((o) => o.id === id)?.label ?? id)}
            onChange={(labels) =>
              void save({ intents: INTENT_OPTIONS.filter((o) => labels.includes(o.label)).map((o) => o.id) })
            }
          />
        </Stack>

        <Divider />

        <Toggle
          label="Pause daily introductions"
          checked={local.paused}
          onChange={(v) => void save({ paused: v })}
        />
        {local.paused && (
          <Text variant="caption" tone="dim">
            You won't receive or appear in introductions while paused. Existing matches stay.
          </Text>
        )}
      </Stack>
    </Card>
  );
}
