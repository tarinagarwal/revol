import { AppHeader, Screen, Stack, Text } from "@/components/ui";
import { PhotoManager } from "@/features/media/PhotoManager";

/** /app/photos — manage the six veiled photos. */
export function PhotosScreen() {
  return (
    <Screen>
      <AppHeader title="Your photos" showBack />
      <div className="mx-auto w-full max-w-lg flex-1 px-6 py-8">
        <Stack gap={6}>
          <Text variant="caption" tone="dim">
            Six frames of your story. The first is your primary — the one revealed when the blur lifts.
          </Text>
          <PhotoManager />
        </Stack>
      </div>
    </Screen>
  );
}
