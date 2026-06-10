import { z } from "zod";

import { MAX_SCORE, MIN_SCORE, SCORE_CATEGORIES } from "@/lib/constants";

// mirrors the backend's ScoreCreate: a category, a 1-5 score, an optional note.
export const scoreSchema = z.object({
  category: z.enum(SCORE_CATEGORIES, {
    errorMap: () => ({ message: "Pick a category" }),
  }),
  score: z.coerce
    .number()
    .int()
    .min(MIN_SCORE, `Score must be ${MIN_SCORE}-${MAX_SCORE}`)
    .max(MAX_SCORE, `Score must be ${MIN_SCORE}-${MAX_SCORE}`),
  note: z.string().max(500, "Keep the note under 500 characters").optional(),
});

export const notesSchema = z.object({
  internal_notes: z.string().max(2000, "Notes are too long (2000 char max)"),
});
