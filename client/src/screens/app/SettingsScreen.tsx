import { useNavigate } from "react-router-dom";
import { Button, Card, Divider, Page, PageHeader, Row, Stack, Text, toast } from "@/components/ui";
import { ShieldIcon, LockIcon, BellIcon } from "@/components/icons";
import { useAuthStore } from "@/store/authStore";
import { logoutRequest } from "@/features/auth/auth.api";

/** /app/settings — account controls. Privacy/safety controls deepen in Epic 9. */
export function SettingsScreen() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const signOut = async () => {
    await logoutRequest();
    toast("Signed out — see you soon", "info");
    void navigate("/");
  };

  return (
    <Page width="narrow">
      <PageHeader eyebrow="Account" title="Settings" />
      <Stack gap={6}>
      <Card padded={false} className="px-5 py-2 sm:px-6">
        <Stack gap={0}>
          <Row gap={3} className="py-3">
            <Stack gap={1} className="flex-1">
              <Text variant="label" tone="dim">
                Account
              </Text>
              <Text variant="body">{user?.email}</Text>
            </Stack>
          </Row>
          <Divider />
          <Row gap={3} className="py-3">
            <BellIcon size={18} className="text-ivory-dim" />
            <Text variant="body" tone="dim" className="flex-1">
              Notifications
            </Text>
            <Text variant="caption" tone="dim">
              Coming soon
            </Text>
          </Row>
          <Divider />
          <Row gap={3} className="py-3">
            <LockIcon size={18} className="text-ivory-dim" />
            <Text variant="body" tone="dim" className="flex-1">
              Privacy
            </Text>
            <Text variant="caption" tone="dim">
              Coming soon
            </Text>
          </Row>
          <Divider />
          <Row gap={3} className="py-3">
            <ShieldIcon size={18} className="text-ivory-dim" />
            <Text variant="body" tone="dim" className="flex-1">
              Safety center
            </Text>
            <Text variant="caption" tone="dim">
              Coming soon
            </Text>
          </Row>
        </Stack>
      </Card>

      <Button variant="outline" fullWidth onPress={() => void signOut()}>
        Sign out
      </Button>

      <Text variant="caption" tone="dim" className="text-center">
        Revol {__APP_VERSION__} · Chemistry before clarity
      </Text>
      </Stack>
    </Page>
  );
}
