import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  fetchCandidate,
  fetchCandidates,
  type CandidateFilters,
} from "./api";

// central place for this feature's query keys so queries and the mutations
// that invalidate them never drift apart.
export const candidateKeys = {
  all: ["candidates"] as const,
  list: (filters: CandidateFilters) =>
    ["candidates", "list", filters] as const,
  detail: (id: string | undefined) =>
    ["candidates", "detail", String(id)] as const,
};

export function useCandidatesQuery(filters: CandidateFilters) {
  return useQuery({
    queryKey: candidateKeys.list(filters),
    queryFn: () => fetchCandidates(filters),
    // keep the previous page on screen while the next one loads
    placeholderData: keepPreviousData,
  });
}

export function useCandidateQuery(id: string | undefined) {
  return useQuery({
    queryKey: candidateKeys.detail(id),
    queryFn: () => fetchCandidate(id ?? ""),
    enabled: Boolean(id),
  });
}
