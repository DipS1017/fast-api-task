import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CandidateFilters } from "@/features/candidates/components/candidate-filters";
import { CandidateTable } from "@/features/candidates/components/candidate-table";
import { useCandidatesQuery } from "@/features/candidates/queries";
import { PAGE_SIZE } from "@/lib/constants";

const EMPTY_FILTERS = {
  status: "",
  role_applied: "",
  skill: "",
  keyword: "",
};

export default function CandidateListPage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [offset, setOffset] = useState(0);

  const query = useCandidatesQuery({ ...filters, offset, limit: PAGE_SIZE });
  const data = query.data ?? { items: [], total: 0 };

  function onFiltersChange(next) {
    setOffset(0); // any filter change sends us back to the first page
    setFilters(next);
  }

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-5 py-6">
      <h1 className="text-2xl font-semibold tracking-tight">Candidates</h1>

      <CandidateFilters filters={filters} onChange={onFiltersChange} />

      {query.isError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {query.error.message}
        </p>
      )}

      <CandidateTable candidates={data.items} loading={query.isLoading} />

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          disabled={offset === 0}
          onClick={() => setOffset(offset - PAGE_SIZE)}
        >
          ← Prev
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages} · {data.total} total
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => setOffset(offset + PAGE_SIZE)}
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
