import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/authStore";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export type RealtimeEvent =
  | { type: "message"; matchId: string; message: Record<string, unknown> }
  | { type: "typing"; matchId: string; userId: string }
  | { type: "read"; matchId: string; userId: string; at: string }
  | { type: "reveal"; matchId: string; revealLevel: number }
  | { type: "notification"; notification: { title: string; body: string; link: string } };

/**
 * ONE shared SSE connection per app instance, however many components listen.
 * (Screens and threads both subscribe; opening a socket each would double
 * server connections for no benefit.)
 */
type Listener = (event: RealtimeEvent) => void;

const listeners = new Set<Listener>();
const statusListeners = new Set<(connected: boolean) => void>();
let source: EventSource | null = null;
let currentToken: string | null = null;
let connected = false;

function setConnected(value: boolean) {
  connected = value;
  statusListeners.forEach((fn) => fn(value));
}

function connect(token: string) {
  if (source && currentToken === token) return;
  source?.close();
  currentToken = token;

  const es = new EventSource(`${BASE_URL}/chat/stream?token=${encodeURIComponent(token)}`);
  source = es;

  es.addEventListener("ready", () => setConnected(true));
  es.onopen = () => setConnected(true);
  es.onerror = () => setConnected(false); // EventSource retries on its own

  for (const type of ["message", "typing", "read", "reveal", "notification"] as const) {
    es.addEventListener(type, (e) => {
      try {
        const parsed = JSON.parse((e as MessageEvent).data) as RealtimeEvent;
        listeners.forEach((fn) => fn(parsed));
      } catch {
        // Ignore malformed frames.
      }
    });
  }
}

function disconnect() {
  source?.close();
  source = null;
  currentToken = null;
  setConnected(false);
}

// Mobile WebViews suspend sockets in the background — reopen on return.
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && currentToken && source?.readyState === EventSource.CLOSED) {
      const token = currentToken;
      currentToken = null;
      connect(token);
    }
  });
}

export function useRealtime(onEvent: (event: RealtimeEvent) => void) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [isConnected, setIsConnected] = useState(connected);
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    const listener: Listener = (event) => handlerRef.current(event);
    listeners.add(listener);
    statusListeners.add(setIsConnected);

    if (accessToken) connect(accessToken);
    else disconnect();

    return () => {
      listeners.delete(listener);
      statusListeners.delete(setIsConnected);
      // Last listener out closes the connection.
      if (listeners.size === 0) disconnect();
    };
  }, [accessToken]);

  return { connected: isConnected };
}
