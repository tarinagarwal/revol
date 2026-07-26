import { Page, PageHeader } from "@/components/ui";
import { PhotoManager } from "@/features/media/PhotoManager";
import { BackButton } from "@/components/ui";

/** /app/photos — manage the six veiled photos. */
export function PhotosScreen() {
  return (
    <Page width="wide">
      <PageHeader
        eyebrow="Your gallery"
        title="Photos"
        subtitle="Six frames of your story. The first is your primary — the one revealed when the blur lifts."
        actions={<BackButton />}
      />
      <PhotoManager />
    </Page>
  );
}
