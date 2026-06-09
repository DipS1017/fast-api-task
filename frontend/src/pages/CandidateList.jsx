import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

const PAGE_SIZE = 20;
const STATUSES = ["new", "reviewed", "hired", "rejected"];

export default function CandidateList() {
  const [filters, setFilters] = useState({
    status: "",
    role_applied: "",
    skill: "",
    keyword: "",
  });
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listCandidates({
        ...filters,
        offset,
        limit: PAGE_SIZE,
      });
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // reload whenever filters or the page offset change
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, offset]);

  function updateFilter(key, value) {
    setOffset(0); // jumping filters should reset us to the first page
    setFilters((f) => ({ ...f, [key]: value }));
  }

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  return (
    <div>
      <h1>Candidates</h1>

      <div className="filters">
        <input
          placeholder="Search name or email…"
          value={filters.keyword}
          onChange={(e) => updateFilter("keyword", e.target.value)}
        />
        <select
          value={filters.status}
          onChange={(e) => updateFilter("status", e.target.value)}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          placeholder="Role applied"
          value={filters.role_applied}
          onChange={(e) => updateFilter("role_applied", e.target.value)}
        />
        <input
          placeholder="Skill (e.g. react)"
          value={filters.skill}
          onChange={(e) => updateFilter("skill", e.target.value)}
        />
      </div>

      {error && <div className="error-box">{error}</div>}

      {loading ? (
        <p className="muted">Loading candidates…</p>
      ) : data.items.length === 0 ? (
        <p className="muted">No candidates match these filters.</p>
      ) : (
        <table className="candidate-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Skills</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link to={`/candidates/${c.id}`}>{c.name}</Link>
                  <div className="muted small">{c.email}</div>
                </td>
                <td>{c.role_applied}</td>
                <td>
                  <span className={`status status-${c.status}`}>{c.status}</span>
                </td>
                <td>
                  {c.skills.map((s) => (
                    <span key={s} className="chip">
                      {s}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="pagination">
        <button disabled={offset === 0} onClick={() => setOffset(offset - PAGE_SIZE)}>
          ← Prev
        </button>
        <span className="muted">
          Page {page} of {totalPages} · {data.total} total
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setOffset(offset + PAGE_SIZE)}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
