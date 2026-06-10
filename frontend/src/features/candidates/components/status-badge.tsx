import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CandidateStatus } from "@/lib/types";

const STATUS_STYLES: Record<CandidateStatus, string> = {
  new: "bg-blue-100 text-blue-700",
  reviewed: "bg-amber-100 text-amber-700",
  hired: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  archived: "bg-slate-200 text-slate-600",
};

export function StatusBadge({ status }: { status: CandidateStatus }) {
  return (
    <Badge
      variant="secondary"
      className={cn("capitalize", STATUS_STYLES[status])}
    >
      {status}
    </Badge>
  );
}
