import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { useAuthStore } from "@/store/authStore";
import { registerDevice } from "./notifications.api";

/**
 * Native push registration (Epic 12). Android/iOS get FCM/APNs tokens through
 * Capacitor; desktop and web rely on the SSE stream plus the Notification API.
 * Failures are silent — push is an enhancement, never a blocker.
 */
export function usePush() {
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) return;

    if (!Capacitor.isNativePlatform()) {
      // Desktop/web: ask once so realtime events can raise OS notifications.
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        void Notification.requestPermission().catch(() => undefined);
      }
      return;
    }

    let cleanup: (() => void) | undefined;
    void (async () => {
      try {
        const { PushNotifications } = await import("@capacitor/push-notifications");
        const perm = await PushNotifications.requestPermissions();
        if (perm.receive !== "granted") return;

        await PushNotifications.register();
        const reg = await PushNotifications.addListener("registration", (token) => {
          void registerDevice(token.value, Capacitor.getPlatform() === "ios" ? "ios" : "android").catch(
            () => undefined,
          );
        });
        cleanup = () => void reg.remove();
      } catch {
        // Push unavailable on this device — the in-app centre still works.
      }
    })();

    return () => cleanup?.();
  }, [accessToken]);
}

/** Raises an OS notification on desktop/web when the app isn't focused. */
export function showDesktopNotification(title: string, body: string): void {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  if (document.visibilityState === "visible") return; // already looking at it
  try {
    new Notification(title, { body, icon: "/brand/logo-placeholder.svg" });
  } catch {
    // Some webviews expose the API but refuse to construct it.
  }
}
