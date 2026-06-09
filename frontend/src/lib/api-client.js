const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const TOKEN_KEY = "token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// FastAPI returns validation errors as a list of objects; flatten to a string.
function detailToMessage(detail) {
  if (!detail) return null;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => e.msg).join(", ");
  return null;
}

/**
 * Thin fetch wrapper. Attaches the bearer token, sends/receives JSON and
 * throws an Error with a readable message on a non-2xx response so TanStack
 * Query can surface it through `error`.
 */
export async function apiFetch(path, { method = "GET", body, headers } = {}) {
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

  if (resp.status === 204) return null;

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(
      detailToMessage(data.detail) || `Request failed (${resp.status})`
    );
  }
  return data;
}
