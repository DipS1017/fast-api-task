import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createScore, requestSummary, updateNotes } from "./api";
import { candidateKeys } from "./queries";

// Every candidate write invalidates the detail query on success so the UI
// refetches the fresh scores / summary / notes instead of us hand-patching
// the cache. This shared hook captures that pattern.
function useDetailMutation(id, mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.detail(id) });
    },
  });
}

export function useSubmitScoreMutation(id) {
  return useDetailMutation(id, (payload) => createScore(id, payload));
}

export function useGenerateSummaryMutation(id) {
  return useDetailMutation(id, () => requestSummary(id));
}

export function useUpdateNotesMutation(id) {
  return useDetailMutation(id, (notes) => updateNotes(id, notes));
}
