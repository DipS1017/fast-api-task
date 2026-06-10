// Domain types mirroring the backend API responses. These mirror the
// pydantic schemas in the backend's app/schemas.py and the enums in
// app/constants.py, and are kept in sync by hand.

export type Role = "admin" | "reviewer";

export type CandidateStatus =
  | "new"
  | "reviewed"
  | "hired"
  | "rejected"
  | "archived";

export interface Score {
  id: number;
  candidate_id: number;
  category: string;
  score: number;
  reviewer_id: number;
  note: string | null;
  created_at: string;
}

export interface CandidateListItem {
  id: number;
  name: string;
  email: string;
  role_applied: string;
  status: CandidateStatus;
  skills: string[];
  created_at: string;
}

export interface CandidateDetail extends CandidateListItem {
  summary: string | null;
  scores: Score[];
  // only populated for admins, stays null for reviewers
  internal_notes: string | null;
}

export interface PaginatedCandidates {
  items: CandidateListItem[];
  total: number;
  offset: number;
  limit: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: Role;
}

export interface SummaryResponse {
  candidate_id: number;
  summary: string;
}
