import { useNavigate } from "react-router-dom";
import { AppHeader, Avatar, Button, EmptyState, IconButton, Screen, Stack, Text, toast } from "@/components/ui";
import { BellIcon, InfinityIcon, SettingsIcon } from "@/components/icons";
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
