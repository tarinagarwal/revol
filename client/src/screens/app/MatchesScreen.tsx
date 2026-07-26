import { EmptyState, Stack } from "@/components/ui";
import { HeartIcon } from "@/components/icons";

/** /app/matches — mutual connections land here (Epic 7 populates it). */
export function MatchesScreen() {
  return (
    <Stack gap={6} className="mx-auto w-full max-w-lg px-5 py-8">
      <EmptyState
        icon={<HeartIcon size={40} />}
        title="No mutual stories yet"
        description="When someone you reached for reaches back, they appear here — and the conversation begins."
      />
    </Stack>
  );
}
