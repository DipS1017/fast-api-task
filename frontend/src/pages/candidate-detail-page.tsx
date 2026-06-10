import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/auth-context";
import { InternalNotesCard } from "@/features/candidates/components/internal-notes-card";
import { ScoresCard } from "@/features/candidates/components/scores-card";
import { StatusBadge } from "@/features/candidates/components/status-badge";
import { SummaryCard } from "@/features/candidates/components/summary-card";
import { useCandidateQuery } from "@/features/candidates/queries";

export default function CandidateDetailPage() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const { data: candidate, isLoading, isError, error } = useCandidateQuery(id);

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-5 py-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to candidates
      </Link>

      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : isError ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error.message}
        </p>
      ) : candidate ? (
        <>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {candidate.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {candidate.email} · applied for {candidate.role_applied}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {candidate.skills.map((s) => (
                  <Badge key={s} variant="outline" className="font-normal">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
            <StatusBadge status={candidate.status} />
          </div>

          <SummaryCard candidate={candidate} />
          <ScoresCard candidate={candidate} isAdmin={isAdmin} />
          {isAdmin && <InternalNotesCard candidate={candidate} />}
        </>
      ) : null}
    </div>
  );
}
