import { EmptyState, Stack } from "@/components/ui";
import { ChatIcon } from "@/components/icons";

/** /app/chat — realtime conversations arrive with Epic 8. */
export function ChatScreen() {
  return (
    <Stack gap={6} className="mx-auto w-full max-w-lg px-5 py-8">
      <EmptyState
        icon={<ChatIcon size={40} />}
        title="Quiet, for now"
        description="Conversations open once a match is mutual. Words first, faces later — that's the Revol way."
      />
    </Stack>
  );
}
