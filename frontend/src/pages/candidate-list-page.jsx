import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";

import { Button } from "@/components/ui/button";
import { CandidateFilters } from "@/features/candidates/components/candidate-filters";
import { CandidateTable } from "@/features/candidates/components/candidate-table";
import { useCandidatesQuery } from "@/features/candidates/queries";
import { PAGE_SIZE } from "@/lib/constants";

// nuqs keeps filters + page in the URL query string, so a filtered view is
// shareable, bookmarkable and survives a refresh. Defaults drop out of the URL.
// Keeping page in the same group means a filter change is one atomic URL update
// (one render, one fetch) rather than two.
const queryParsers = {
  status: parseAsString.withDefault(""),
  role_applied: parseAsString.withDefault(""),
  skill: parseAsString.withDefault(""),
  keyword: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
};

export default function CandidateListPage() {
  const [params, setParams] = useQueryStates(queryParsers);
  const { page, ...filters } = params;

  const offset = (page - 1) * PAGE_SIZE;
  const query = useCandidatesQuery({ ...filters, offset, limit: PAGE_SIZE });
  const data = query.data ?? { items: [], total: 0 };
  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  function onFiltersChange(next) {
    // a filter change resets to page 1; replace history so typing doesn't pile
    // up back-button entries
    setParams({ ...next, page: 1 }, { history: "replace" });
  }

  function goToPage(nextPage) {
    // push history so the back button steps through pages
    setParams({ page: nextPage }, { history: "push" });
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
          onClick={() => goToPage(page - 1)}
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
          onClick={() => goToPage(page + 1)}
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
