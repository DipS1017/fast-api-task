import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CANDIDATE_STATUSES } from "@/lib/constants";

const ALL = "__all__";

export function CandidateFilters({ filters, onChange }) {
  function set(key, value) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Search name or email…"
          value={filters.keyword}
          onChange={(e) => set("keyword", e.target.value)}
        />
      </div>

      <Select
        value={filters.status || ALL}
        onValueChange={(v) => set("status", v === ALL ? "" : v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          {CANDIDATE_STATUSES.map((s) => (
            <SelectItem key={s} value={s} className="capitalize">
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        placeholder="Role applied"
        value={filters.role_applied}
        onChange={(e) => set("role_applied", e.target.value)}
      />

      <Input
        placeholder="Skill (e.g. react)"
        value={filters.skill}
        onChange={(e) => set("skill", e.target.value)}
      />
    </div>
  );
}
