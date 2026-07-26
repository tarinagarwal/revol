import { useAuthStore } from "@/store/authStore";

/**
 * HTTP client for the Revol server.
 * Attaches the access token; on 401 it rotates the refresh token once and
 * retries. A failed rotation clears the session (route guards redirect).
 */
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseError(res: Response): Promise<ApiError> {
  const text = await res.text();
  try {
    const json = JSON.parse(text) as { error?: string };
    return new ApiError(res.status, json.error ?? text);
  } catch {
    return new ApiError(res.status, text || res.statusText);
  }
}

let refreshing: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  // Single-flight: parallel 401s share one rotation.
  refreshing ??= (async () => {
    const { refreshToken, setTokens, setUser, clear } = useAuthStore.getState();
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        clear();
        return false;
      }
      const data = (await res.json()) as {
        user: import("@/store/authStore").AuthUser;
        accessToken: string;
        refreshToken: string;
      };
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      return true;
    } catch {
      return false;
    } finally {
      setTimeout(() => {
        refreshing = null;
      }, 0);
    }
  })();
  return refreshing;
}

/** Multipart upload variant — browser sets the boundary content-type. */
export async function apiForm<T>(path: string, form: FormData): Promise<T> {
  const doFetch = () => {
    const { accessToken } = useAuthStore.getState();
    return fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      body: form,
    });
  };
  let res = await doFetch();
  if (res.status === 401 && useAuthStore.getState().refreshToken) {
    const ok = await tryRefresh();
    if (ok) res = await doFetch();
  }
  if (!res.ok) throw await parseError(res);
  return res.json() as Promise<T>;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const doFetch = () => {
    const { accessToken } = useAuthStore.getState();
    return fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        // Only claim JSON when a body exists — Fastify 400s on
        // content-type: application/json with an empty body.
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...init?.headers,
      },
    });
  };

  let res = await doFetch();

  if (res.status === 401 && useAuthStore.getState().refreshToken) {
    const ok = await tryRefresh();
    if (ok) res = await doFetch();
  }

  if (!res.ok) throw await parseError(res);
  return res.json() as Promise<T>;
}
