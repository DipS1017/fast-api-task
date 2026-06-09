import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreForm } from "./score-form";

export function ScoresCard({ candidate, isAdmin }) {
  const scores = candidate.scores ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-baseline gap-2">
          Scores
          <span className="text-xs font-normal text-muted-foreground">
            {isAdmin ? "all reviewers" : "your scores only"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {scores.length === 0 ? (
          <p className="text-sm text-muted-foreground">No scores recorded yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {scores.map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-2 text-sm">
                <Badge className="shrink-0">{s.score}/5</Badge>
                <span className="font-medium">{s.category}</span>
                {s.note && (
                  <span className="text-muted-foreground">— {s.note}</span>
                )}
                {isAdmin && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    reviewer #{s.reviewer_id}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}

        <ScoreForm candidateId={candidate.id} />
      </CardContent>
    </Card>
  );
}
