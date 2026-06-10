import { STORAGE_KEYS } from "./constants";
import type { TokenResponse } from "./types";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function getToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
}

function getRefreshToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.REFRESH);
}

// Registered by the auth layer. Called only when even a refresh fails, so a
// truly dead session boots the user back to the login page.
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

// One shared refresh at a time: if several requests 401 at once they all await
// the same call instead of stampeding /auth/refresh.
let refreshPromise: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const resp = await fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!resp.ok) return false;
    const data = (await resp.json()) as TokenResponse;
    localStorage.setItem(STORAGE_KEYS.TOKEN, data.access_token);
    localStorage.setItem(STORAGE_KEYS.REFRESH, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
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

function sendRequest(path: string, opts: ApiFetchOptions): Promise<Response> {
  const token = getToken();
  return fetch(`${BASE}${path}`, {
    method: opts.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
}

/**
 * Thin fetch wrapper. Attaches the bearer token, sends/receives JSON and throws
 * an Error with a readable message on a non-2xx response so TanStack Query can
 * surface it through `error`.
 *
 * If an authenticated request comes back 401 (expired access token), it tries a
 * single silent refresh and retries the request once. Only if that refresh also
 * fails does it sign the user out. The /auth/* endpoints are excluded so a bad
 * login just shows "invalid credentials".
 */
export async function apiFetch<T>(
  path: string,
  opts: ApiFetchOptions = {}
): Promise<T> {
  const isAuthEndpoint = path.startsWith("/auth/");
  let resp = await sendRequest(path, opts);

  if (resp.status === 401 && getToken() && !isAuthEndpoint) {
    const refreshed = await refreshSession();
    if (refreshed) {
      resp = await sendRequest(path, opts); // retry once with the new token
    }
    if (resp.status === 401) {
      onUnauthorized?.(); // refresh failed (or retry still 401) -> sign out
    }
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
