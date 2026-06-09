import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createScore, requestSummary, updateNotes } from "./api";
import { candidateKeys } from "./queries";

// Each mutation invalidates the candidate detail query on success so the UI
// refetches the fresh scores / summary / notes instead of us hand-patching
// the cache.

export function useSubmitScoreMutation(id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => createScore(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.detail(id) });
    },
  });
}

export function useGenerateSummaryMutation(id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => requestSummary(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.detail(id) });
    },
  });
}

export function useUpdateNotesMutation(id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notes) => updateNotes(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.detail(id) });
    },
  });
}
