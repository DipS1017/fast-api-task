import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGenerateSummaryMutation } from "../mutations";

export function SummaryCard({ candidate }) {
  const mutation = useGenerateSummaryMutation(candidate.id);
  // prefer the freshly generated summary, fall back to whatever was stored
  const summary = mutation.data?.summary ?? candidate.summary;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" /> AI Summary
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          {mutation.isPending
            ? "Generating…"
            : summary
              ? "Regenerate"
              : "Generate summary"}
        </Button>
      </CardHeader>
      <CardContent>
        {mutation.isPending ? (
          <p className="text-sm text-muted-foreground">
            Talking to the model — this takes a couple of seconds…
          </p>
        ) : mutation.isError ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Could not generate summary: {mutation.error.message}
          </p>
        ) : summary ? (
          <p className="text-sm leading-relaxed">{summary}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            No summary yet. Generate one to see it here.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
