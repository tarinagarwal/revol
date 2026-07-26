import { useNavigate } from "react-router-dom";
import { Button, Card, Page, PageHeader, Row, Stack, Text, toast } from "@/components/ui";
import { LockIcon, UserIcon } from "@/components/icons";
import { useAuthStore } from "@/store/authStore";
import { logoutRequest } from "@/features/auth/auth.api";
import { PreferencesCard } from "@/features/preferences/PreferencesCard";
import { PrivacyCard } from "@/features/privacy/PrivacyCard";
import { NotificationPrefsCard } from "@/features/notifications/NotificationPrefsCard";

/** /app/settings — discovery preferences, privacy controls, blocks, account. */
export function SettingsScreen() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const signOut = async () => {
    await logoutRequest();
    toast("Signed out — see you soon", "info");
    void navigate("/");
  };

  return (
    <Page width="full">
      <PageHeader eyebrow="Account" title="Settings" subtitle={user?.email ?? ""} />

      {/* Two independent columns on desktop; single stack on mobile. */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
        <Stack gap={5}>
          <PreferencesCard />
          <NotificationPrefsCard />
        </Stack>

        <Stack gap={5}>
          <PrivacyCard />

          <Card>
            <Stack gap={4}>
              <Row gap={3}>
                <UserIcon size={18} className="text-gold" />
                <Text variant="label" tone="gold" className="flex-1">
                  Session
                </Text>
              </Row>
              <Row gap={3}>
                <LockIcon size={16} className="shrink-0 text-ivory-dim" />
                <Text variant="caption" tone="dim" className="flex-1">
                  Signed in as {user?.email}
                </Text>
              </Row>
              <Button variant="outline" fullWidth onPress={() => void signOut()}>
                Sign out
              </Button>
            </Stack>
          </Card>

          <Text variant="caption" tone="dim" className="text-center">
            Revol {__APP_VERSION__} · Chemistry before clarity
          </Text>
        </Stack>
      </div>
    </Page>
  );
}
