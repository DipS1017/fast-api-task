// Values shared across the frontend. These mirror the backend's
// app/constants.py and are kept in sync by hand (the two sides run in
// different languages, so there's no single source short of codegen).

export const ROLE = {
  ADMIN: "admin",
  REVIEWER: "reviewer",
};

export const CANDIDATE_STATUSES = ["new", "reviewed", "hired", "rejected"];

// scoring categories offered in the scoring form
export const SCORE_CATEGORIES = [
  "Technical",
  "Communication",
  "Problem Solving",
  "Culture Fit",
];

// scores are submitted on a 1-5 scale
export const MIN_SCORE = 1;
export const MAX_SCORE = 5;
export const SCORE_VALUES = [1, 2, 3, 4, 5];

// default candidate list page size (matches the backend default)
export const PAGE_SIZE = 20;

// localStorage keys for the auth session
export const STORAGE_KEYS = {
  TOKEN: "token",
  ROLE: "role",
};
