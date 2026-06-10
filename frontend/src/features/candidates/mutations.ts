import {
  useMutation,
  useQueryClient,
  type MutationFunction,
} from "@tanstack/react-query";

import {
  createScore,
  requestSummary,
  updateNotes,
  type ScorePayload,
} from "./api";
import { candidateKeys } from "./queries";

// Every candidate write invalidates the detail query on success so the UI
// refetches the fresh scores / summary / notes instead of us hand-patching
// the cache. This shared hook captures that pattern.
function useDetailMutation<TData, TVariables>(
  id: string,
  mutationFn: MutationFunction<TData, TVariables>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.detail(id) });
    },
  });
}

export function useSubmitScoreMutation(id: string) {
  return useDetailMutation(id, (payload: ScorePayload) =>
    createScore(id, payload)
  );
}

export function useGenerateSummaryMutation(id: string) {
  return useDetailMutation(id, (_: void) => requestSummary(id));
}

export function useUpdateNotesMutation(id: string) {
  return useDetailMutation(id, (notes: string) => updateNotes(id, notes));
}
