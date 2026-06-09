import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchCandidate, fetchCandidates } from "./api";

// central place for this feature's query keys so queries and the mutations
// that invalidate them never drift apart.
export const candidateKeys = {
  all: ["candidates"],
  list: (filters) => ["candidates", "list", filters],
  detail: (id) => ["candidates", "detail", String(id)],
};

export function useCandidatesQuery(filters) {
  return useQuery({
    queryKey: candidateKeys.list(filters),
    queryFn: () => fetchCandidates(filters),
    // keep the previous page on screen while the next one loads
    placeholderData: keepPreviousData,
  });
}

export function useCandidateQuery(id) {
  return useQuery({
    queryKey: candidateKeys.detail(id),
    queryFn: () => fetchCandidate(id),
    enabled: Boolean(id),
  });
}
