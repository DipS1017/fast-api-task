import { useEffect, useState } from "react";
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
import { useDebouncedCallback } from "@/lib/use-debounced-callback";

const ALL = "__all__";
const DEBOUNCE_MS = 350;

export function CandidateFilters({ filters, onChange }) {
  // The text fields update locally on every keystroke for a snappy input, but
  // only push to the URL / query once typing settles. The status select is a
  // discrete choice, so it applies immediately.
  const [text, setText] = useState({
    keyword: filters.keyword,
    role_applied: filters.role_applied,
    skill: filters.skill,
  });

  // re-sync local text when filters change from outside (deep link, refresh)
  useEffect(() => {
    setText({
      keyword: filters.keyword,
      role_applied: filters.role_applied,
      skill: filters.skill,
    });
  }, [filters.keyword, filters.role_applied, filters.skill]);

  const pushText = useDebouncedCallback((nextText) => {
    onChange({ ...filters, ...nextText });
  }, DEBOUNCE_MS);

  function onText(key, value) {
    const nextText = { ...text, [key]: value };
    setText(nextText);
    pushText(nextText);
  }

  function onStatus(value) {
    // flush any pending text edit alongside the status change
    pushText.cancel();
    onChange({ ...filters, ...text, status: value });
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Search name or email…"
          value={text.keyword}
          onChange={(e) => onText("keyword", e.target.value)}
        />
      </div>

      <Select
        value={filters.status || ALL}
        onValueChange={(v) => onStatus(v === ALL ? "" : v)}
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
        value={text.role_applied}
        onChange={(e) => onText("role_applied", e.target.value)}
      />

      <Input
        placeholder="Skill (e.g. react)"
        value={text.skill}
        onChange={(e) => onText("skill", e.target.value)}
      />
    </div>
  );
}
