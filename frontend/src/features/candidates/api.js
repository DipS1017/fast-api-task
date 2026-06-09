import { apiFetch } from "@/lib/api-client";

export function fetchCandidates(filters = {}) {
  const qs = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      qs.append(key, value);
    }
  });
  return apiFetch(`/candidates?${qs.toString()}`);
}

export function fetchCandidate(id) {
  return apiFetch(`/candidates/${id}`);
}

export function createScore(id, payload) {
  return apiFetch(`/candidates/${id}/scores`, { method: "POST", body: payload });
}

export function requestSummary(id) {
  return apiFetch(`/candidates/${id}/summary`, { method: "POST" });
}

export function updateNotes(id, internal_notes) {
  return apiFetch(`/candidates/${id}/notes`, {
    method: "PATCH",
    body: { internal_notes },
  });
}
