import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSubmitScoreMutation } from "../mutations";

const CATEGORIES = ["Technical", "Communication", "Problem Solving", "Culture Fit"];

export function ScoreForm({ candidateId }) {
  const mutation = useSubmitScoreMutation(candidateId);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [score, setScore] = useState("3");
  const [note, setNote] = useState("");

  function onSubmit(e) {
    e.preventDefault();
    mutation.mutate(
      { category, score: Number(score), note: note || null },
      { onSuccess: () => setNote("") }
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={score} onValueChange={setScore}>
          <SelectTrigger className="sm:w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} / 5
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          className="flex-1"
          placeholder="Optional note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          Add score
        </Button>
      </div>

      {mutation.isError && (
        <p className="text-sm text-destructive">{mutation.error.message}</p>
      )}
    </form>
  );
}
