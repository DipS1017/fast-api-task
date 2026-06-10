import { parseAsInteger, parseAsString, useQueryState, useQueryStates } from "nuqs";

import { Button } from "@/components/ui/button";
import { CandidateFilters } from "@/features/candidates/components/candidate-filters";
import { CandidateTable } from "@/features/candidates/components/candidate-table";
import { useCandidatesQuery } from "@/features/candidates/queries";
import { PAGE_SIZE } from "@/lib/constants";

// nuqs keeps these in the URL query string, so filters + page are shareable,
// bookmarkable and survive a refresh. Empty/default values drop out of the URL.
const filterParsers = {
  status: parseAsString.withDefault(""),
  role_applied: parseAsString.withDefault(""),
  skill: parseAsString.withDefault(""),
  keyword: parseAsString.withDefault(""),
};

export default function CandidateListPage() {
  // filter typing replaces history so it doesn't pile up back-button entries
  const [filters, setFilters] = useQueryStates(filterParsers, {
    history: "replace",
  });
  // paging pushes history so the back button steps through pages
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1).withOptions({ history: "push" })
  );

  const offset = (page - 1) * PAGE_SIZE;
  const query = useCandidatesQuery({ ...filters, offset, limit: PAGE_SIZE });
  const data = query.data ?? { items: [], total: 0 };
  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  function onFiltersChange(next) {
    // a filter change resets to page 1; both updates batch into one navigation
    setFilters(next);
    setPage(1);
  }

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
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
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
          onClick={() => setPage(page + 1)}
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
