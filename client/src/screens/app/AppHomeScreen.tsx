import { useNavigate } from "react-router-dom";
import { AppHeader, Avatar, Button, Card, EmptyState, IconButton, Row, Screen, Stack, Text, toast } from "@/components/ui";
import { BellIcon, CameraIcon, ChevronRightIcon, InfinityIcon, SettingsIcon } from "@/components/icons";
import { useAuthStore } from "@/store/authStore";
import { logoutRequest } from "@/features/auth/auth.api";

/** Protected shell placeholder — Discovery (Epic 6/7) replaces this. */
export function AppHomeScreen() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const logout = async () => {
    await logoutRequest();
    toast("Signed out — see you soon", "info");
    void navigate("/");
  };

  return (
    <Screen>
      <AppHeader
        title="Revol"
        right={
          <>
            <IconButton label="Notifications">
              <BellIcon size={20} />
            </IconButton>
            <IconButton label="Settings">
              <SettingsIcon size={20} />
            </IconButton>
            <Avatar name={user?.displayName ?? "You"} size="sm" ring="gold" />
          </>
        }
      />
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 py-10">
        <Stack gap={8}>
          <Stack gap={1}>
            <Text variant="label" tone="gold">
              Signed in
            </Text>
            <Text variant="heading">Hey, {user?.displayName}.</Text>
          </Stack>
          <Card onPress={() => void navigate("/app/photos")}>
            <Row gap={4}>
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-gold/30 text-gold">
                <CameraIcon size={20} />
              </span>
              <Stack gap={1} className="flex-1">
                <Text variant="body">Your photos</Text>
                <Text variant="caption" tone="dim">
                  Add up to six — veiled until chemistry earns the reveal.
                </Text>
              </Stack>
              <ChevronRightIcon size={18} className="text-ivory-dim" />
            </Row>
          </Card>
          <EmptyState
            icon={<InfinityIcon size={40} />}
            title="Your story starts here"
            description="Discovery, chemistry and reveals arrive with the next epics. This screen proves the guarded shell works."
            action={
              <Button variant="outline" size="sm" onPress={() => void logout()}>
                Sign out
              </Button>
            }
          />
        </Stack>
      </div>
    </Screen>
  );
}
