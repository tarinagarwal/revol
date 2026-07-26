import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Card, Divider, Input, Row, Sheet, Spinner, Stack, Text, Toggle, toast } from "@/components/ui";
import { LockIcon, ShieldIcon, CloseIcon } from "@/components/icons";
import { useNavigate } from "react-router-dom";
import {
  deleteAccount,
  getBlocks,
  getPrivacySettings,
  unblockUser,
  updatePrivacySettings,
  type PrivacySettings,
} from "@/features/safety/safety.api";
import { useAuthStore } from "@/store/authStore";
import { ApiError } from "@/lib/api";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

/** Epic 9 — visibility toggles, blocked list, data export, account deletion. */
export function PrivacyCard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["privacy"], queryFn: getPrivacySettings });
  const blocksQ = useQuery({ queryKey: ["blocks"], queryFn: getBlocks });
  const [local, setLocal] = useState<PrivacySettings | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (data?.privacy) setLocal(data.privacy);
  }, [data]);

  const save = async (patch: Partial<PrivacySettings>) => {
    setLocal((p) => (p ? { ...p, ...patch } : p));
    try {
      const res = await updatePrivacySettings(patch);
      setLocal(res.privacy);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not save", "error");
      void queryClient.invalidateQueries({ queryKey: ["privacy"] });
    }
  };

  /** Fetched with auth then saved locally — the endpoint isn't public. */
  const exportData = async () => {
    setExporting(true);
    try {
      const { accessToken } = useAuthStore.getState();
      const res = await fetch(`${BASE_URL}/privacy/export`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      if (!res.ok) throw new Error("Export failed");
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = "revol-my-data.json";
      a.click();
      URL.revokeObjectURL(url);
      toast("Your data is downloading", "success");
    } catch {
      toast("Could not export your data", "error");
    } finally {
      setExporting(false);
    }
  };

  const confirmDelete = async () => {
    if (!password) {
      toast("Enter your password to confirm", "error");
      return;
    }
    setDeleting(true);
    try {
      await deleteAccount(password);
      useAuthStore.getState().clear();
      toast("Your account and everything in it is gone.", "info");
      void navigate("/");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not delete account", "error");
    } finally {
      setDeleting(false);
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

  const blocks = blocksQ.data?.blocks ?? [];

  return (
    <>
      <Card>
        <Stack gap={5}>
          <Row gap={3}>
            <LockIcon size={18} className="text-gold" />
            <Text variant="label" tone="gold" className="flex-1">
              Privacy
            </Text>
          </Row>

          <Stack gap={4}>
            <Toggle label="Show my city" checked={local.showCity} onChange={(v) => void save({ showCity: v })} />
            <Toggle label="Show my age" checked={local.showAge} onChange={(v) => void save({ showAge: v })} />
            <Toggle
              label="Let matches hear my voice intro"
              checked={local.allowVoicePlayback}
              onChange={(v) => void save({ allowVoicePlayback: v })}
            />
            <Toggle
              label="Send read receipts"
              checked={local.readReceipts}
              onChange={(v) => void save({ readReceipts: v })}
            />
          </Stack>

          <Divider />

          <Stack gap={3}>
            <Text variant="caption" tone="dim">
              Download everything Revol holds about you — profile, matches, messages you've sent.
            </Text>
            <Button variant="outline" size="sm" loading={exporting} onPress={() => void exportData()}>
              Export my data
            </Button>
          </Stack>
        </Stack>
      </Card>

      {blocks.length > 0 && (
        <Card>
          <Stack gap={4}>
            <Row gap={3}>
              <ShieldIcon size={18} className="text-gold" />
              <Text variant="label" tone="gold" className="flex-1">
                Blocked
              </Text>
            </Row>
            <Stack gap={2}>
              {blocks.map((b) => (
                <Row key={b.id} gap={3}>
                  <Text variant="body" className="flex-1 truncate">
                    {b.displayName}
                  </Text>
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={() =>
                      void unblockUser(b.userId).then(() => {
                        toast("Unblocked", "info");
                        void queryClient.invalidateQueries({ queryKey: ["blocks"] });
                      })
                    }
                  >
                    Unblock
                  </Button>
                </Row>
              ))}
            </Stack>
          </Stack>
        </Card>
      )}

      <Card variant="glow">
        <Stack gap={4}>
          <Row gap={3}>
            <CloseIcon size={18} className="text-crimson" />
            <Text variant="label" tone="crimson" className="flex-1">
              Delete account
            </Text>
          </Row>
          <Text variant="caption" tone="dim" className="leading-relaxed">
            This erases your profile, photos, voice, matches and messages permanently. It cannot be undone.
          </Text>
          <Button variant="outline" size="sm" onPress={() => setConfirmOpen(true)}>
            Delete my account
          </Button>
        </Stack>
      </Card>

      <Sheet open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Delete your account?">
        <Stack gap={5}>
          <Text variant="caption" tone="dim" className="leading-relaxed">
            Everything goes: your profile, photos, voice intro, every match and message. Nothing is recoverable.
            Enter your password to confirm.
          </Text>
          <Input
            label="Password"
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Stack gap={3}>
            <Button fullWidth loading={deleting} onPress={() => void confirmDelete()}>
              Delete permanently
            </Button>
            <Button fullWidth variant="ghost" onPress={() => setConfirmOpen(false)}>
              Keep my account
            </Button>
          </Stack>
        </Stack>
      </Sheet>
    </>
  );
}
