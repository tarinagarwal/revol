import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Button, Card, Heading, ProgressBar, Row, Stack, Text } from "@/components/ui";
import { SparkIcon } from "@/components/icons";
import { api } from "@/lib/api";

/**
 * Epic 15 — auto-update, all custom UI, no default dialogs.
 *   Desktop : electron-updater events via the preload bridge
 *             (Available → Download → progress → Restart & Install)
 *   Mobile  : compares app version against the server /version manifest,
 *             offers a store link when behind
 *   Web     : renders nothing (deploys are instant)
 */

type DesktopPhase = "idle" | "available" | "downloading" | "ready" | "error";

type VersionManifest = {
  channels: {
    mobile: { latest: string; minSupported: string; storeUrls: { android: string; ios: string }; mandatory: boolean };
  };
};

function isNewer(latest: string, current: string): boolean {
  const l = latest.split(".").map(Number);
  const c = current.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const a = l[i] ?? 0;
    const b = c[i] ?? 0;
    if (a > b) return true;
    if (a < b) return false;
  }
  return false;
}

export function UpdateManager() {
  const desktop = window.revolDesktop;
  const [phase, setPhase] = useState<DesktopPhase>("idle");
  const [version, setVersion] = useState("");
  const [percent, setPercent] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [storeUrl, setStoreUrl] = useState<string | null>(null);

  // Desktop wiring — listeners first, then a renderer-driven silent check
  // (no race with main's startup check: we're guaranteed to be listening).
  useEffect(() => {
    if (!desktop) return;
    desktop.update.onAvailable((info) => {
      setVersion(info.version);
      setPhase("available");
    });
    desktop.update.onProgress((p) => {
      setPhase("downloading");
      setPercent(p.percent);
    });
    desktop.update.onReady(() => setPhase("ready"));
    desktop.update.onError(() => setPhase("error"));
    void desktop.update.check(false).catch(() => undefined);
  }, [desktop]);

  // Mobile wiring — native platforms only
  useEffect(() => {
    if (desktop || !Capacitor.isNativePlatform()) return;
    void (async () => {
      try {
        const manifest = await api<VersionManifest>("/version");
        const { latest, storeUrls } = manifest.channels.mobile;
        if (isNewer(latest, __APP_VERSION__)) {
          setVersion(latest);
          const platform = Capacitor.getPlatform();
          setStoreUrl(platform === "ios" ? storeUrls.ios : storeUrls.android);
          setPhase("available");
        }
      } catch {
        // Quietly skip — update prompts must never break the app.
      }
    })();
  }, [desktop]);

  if (phase === "idle" || dismissed) return null;

  return (
    <div className="fixed right-4 bottom-4 z-110 w-[min(22rem,calc(100vw-2rem))] animate-[revol-toast-in_0.4s_var(--ease-reveal)]">
      <Card variant="gold">
        <Stack gap={4}>
          <Row gap={3}>
            <SparkIcon size={20} className="shrink-0 text-gold" />
            <Heading level={4}>
              {phase === "ready" ? "Ready to install" : phase === "error" ? "Update issue" : "Update available"}
            </Heading>
          </Row>

          {phase === "available" && (
            <>
              <Text variant="caption" tone="dim">
                Revol {version} is here — refined chemistry awaits.
              </Text>
              <Row gap={3} className="justify-end">
                <Button size="sm" variant="ghost" onPress={() => setDismissed(true)}>
                  Later
                </Button>
                {desktop ? (
                  <Button size="sm" onPress={() => void desktop.update.download()}>
                    Download
                  </Button>
                ) : (
                  storeUrl && (
                    <Button size="sm" onPress={() => window.open(storeUrl, "_blank")}>
                      Update
                    </Button>
                  )
                )}
              </Row>
            </>
          )}

          {phase === "downloading" && <ProgressBar value={percent} label="Downloading" />}

          {phase === "ready" && (
            <>
              <Text variant="caption" tone="dim">
                Restart to finish updating.
              </Text>
              <Row gap={3} className="justify-end">
                <Button size="sm" variant="ghost" onPress={() => setDismissed(true)}>
                  Later
                </Button>
                <Button size="sm" onPress={() => void desktop?.update.install()}>
                  Restart &amp; Install
                </Button>
              </Row>
            </>
          )}

          {phase === "error" && (
            <>
              <Text variant="caption" tone="dim">
                Couldn't fetch the update. We'll try again next launch.
              </Text>
              <Row gap={3} className="justify-end">
                <Button size="sm" variant="ghost" onPress={() => setDismissed(true)}>
                  Dismiss
                </Button>
              </Row>
            </>
          )}
        </Stack>
      </Card>
    </div>
  );
}
