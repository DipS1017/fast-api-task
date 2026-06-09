const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// thin wrapper around fetch that attaches the token and surfaces API errors
// as thrown Errors so callers can show them.
async function request(path, options = {}) {
  const resp = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });

  if (resp.status === 204) return null;

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(detailToMessage(data.detail) || `Request failed (${resp.status})`);
  }
  return data;
}

// FastAPI returns validation errors as a list of objects; flatten to a string.
function detailToMessage(detail) {
  if (!detail) return null;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((e) => e.msg).join(", ");
  return null;
}

export const api = {
  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (email, password) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  listCandidates: (params) => {
    const qs = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== "" && v !== null && v !== undefined) qs.append(k, v);
    });
    return request(`/candidates?${qs.toString()}`);
  },

  getCandidate: (id) => request(`/candidates/${id}`),

  submitScore: (id, payload) =>
    request(`/candidates/${id}/scores`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  generateSummary: (id) =>
    request(`/candidates/${id}/summary`, { method: "POST" }),

  updateNotes: (id, notes) =>
    request(`/candidates/${id}/notes`, {
      method: "PATCH",
      body: JSON.stringify({ internal_notes: notes }),
    }),
};
