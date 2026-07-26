import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/authStore";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export type RealtimeEvent =
  | { type: "message"; matchId: string; message: Record<string, unknown> }
  | { type: "typing"; matchId: string; userId: string }
  | { type: "read"; matchId: string; userId: string; at: string }
  | { type: "reveal"; matchId: string; revealLevel: number };

/**
 * Live server events over SSE (Epic 8). EventSource reconnects on its own;
 * we additionally re-open when the access token rotates or the app returns
 * from background, and expose `connected` so the UI can show the truth.
 */
export function useRealtime(onEvent: (event: RealtimeEvent) => void) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [connected, setConnected] = useState(false);
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    if (!accessToken) return;
    let source: EventSource | null = null;
    let closed = false;

    const open = () => {
      if (closed) return;
      source?.close();
      source = new EventSource(`${BASE_URL}/chat/stream?token=${encodeURIComponent(accessToken)}`);

      source.addEventListener("ready", () => setConnected(true));
      source.onerror = () => setConnected(false); // EventSource retries by itself

      for (const type of ["message", "typing", "read", "reveal"] as const) {
        source.addEventListener(type, (e) => {
          try {
            handlerRef.current(JSON.parse((e as MessageEvent).data) as RealtimeEvent);
          } catch {
            // Ignore malformed frames.
          }
        });
      }
    };

    open();

    // Mobile browsers/WebViews suspend sockets in background — reopen on return.
    const onVisible = () => {
      if (document.visibilityState === "visible" && source?.readyState === EventSource.CLOSED) open();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      closed = true;
      document.removeEventListener("visibilitychange", onVisible);
      source?.close();
      setConnected(false);
    };
  }, [accessToken]);

  return { connected };
}
