import { apiFetch } from "@/lib/api-client";
import type {
  CandidateDetail,
  PaginatedCandidates,
  Score,
  SummaryResponse,
} from "@/lib/types";

export interface CandidateFilters {
  status?: string;
  role_applied?: string;
  skill?: string;
  keyword?: string;
  offset?: number;
  limit?: number;
}

export function fetchCandidates(
  filters: CandidateFilters = {}
): Promise<PaginatedCandidates> {
  const qs = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      qs.append(key, String(value));
    }
  });
  return apiFetch<PaginatedCandidates>(`/candidates?${qs.toString()}`);
}

export function fetchCandidate(id: string): Promise<CandidateDetail> {
  return apiFetch<CandidateDetail>(`/candidates/${id}`);
}

export interface ScorePayload {
  category: string;
  score: number;
  note: string | null;
}

export function createScore(id: string, payload: ScorePayload): Promise<Score> {
  return apiFetch<Score>(`/candidates/${id}/scores`, {
    method: "POST",
    body: payload,
  });
}

export function requestSummary(id: string): Promise<SummaryResponse> {
  return apiFetch<SummaryResponse>(`/candidates/${id}/summary`, {
    method: "POST",
  });
}

export function updateNotes(
  id: string,
  internal_notes: string
): Promise<CandidateDetail> {
  return apiFetch<CandidateDetail>(`/candidates/${id}/notes`, {
    method: "PATCH",
    body: { internal_notes },
  });
}
