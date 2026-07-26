import { sendMessage } from "./chat.api";

/**
 * Offline outbox (Epic 8). Messages sent without a connection are persisted
 * and flushed when the network returns, so nothing is silently lost.
 */
const KEY = "revol-outbox";

type Queued = { id: string; matchId: string; body: string; queuedAt: number };

function read(): Queued[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Queued[];
  } catch {
    return [];
  }
}

function write(items: Queued[]): void {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function enqueue(matchId: string, body: string): Queued {
  const item: Queued = { id: `q-${Date.now()}-${Math.random().toString(36).slice(2)}`, matchId, body, queuedAt: Date.now() };
  write([...read(), item]);
  return item;
}

export function remove(id: string): void {
  write(read().filter((i) => i.id !== id));
}

export function pendingFor(matchId: string): Queued[] {
  return read().filter((i) => i.matchId === matchId);
}

/** Attempts every queued message; returns how many were delivered. */
export async function flush(): Promise<number> {
  let sent = 0;
  for (const item of read()) {
    try {
      await sendMessage(item.matchId, item.body);
      remove(item.id);
      sent++;
    } catch {
      break; // still offline / failing — keep the rest queued in order
    }
  }
  return sent;
}

/** Flushes on reconnect for the lifetime of the app. */
export function watchConnectivity(onFlushed: (count: number) => void): () => void {
  const handler = () => {
    void flush().then((n) => {
      if (n > 0) onFlushed(n);
    });
  };
  window.addEventListener("online", handler);
  return () => window.removeEventListener("online", handler);
}
