import { STORAGE_KEYS } from "./constants";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function getToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
}

// Called when an authenticated request comes back 401 (token expired/invalid).
// The auth layer registers its signOut here so a dead token boots the user back
// to the login page instead of leaving them staring at error messages.
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

// FastAPI returns validation errors as a list of objects; flatten to a string.
function detailToMessage(detail: unknown): string | null {
  if (!detail) return null;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((e) => (e as { msg: string }).msg).join(", ");
  }
  return null;
}

export interface ApiFetchOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * Thin fetch wrapper. Attaches the bearer token, sends/receives JSON and
 * throws an Error with a readable message on a non-2xx response so TanStack
 * Query can surface it through `error`.
 */
export async function apiFetch<T>(
  path: string,
  { method = "GET", body, headers }: ApiFetchOptions = {}
): Promise<T> {
  const token = getToken();
  const resp = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // a 401 on a request that *carried* a token means the session is dead
  // (expired/invalid) - sign the user out. a 401 with no token is just a failed
  // login and is left for the caller to surface.
  if (resp.status === 401 && token) {
    onUnauthorized?.();
  }

  if (resp.status === 204) return null as T;

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(
      detailToMessage(data.detail) || `Request failed (${resp.status})`
    );
  }
  return data as T;
}
