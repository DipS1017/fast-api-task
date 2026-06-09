import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";

const CATEGORIES = ["Technical", "Communication", "Problem Solving", "Culture Fit"];

export default function CandidateDetail() {
  const { id } = useParams();
  const { auth } = useAuth();
  const isAdmin = auth?.role === "admin";

  const [candidate, setCandidate] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    setError(null);
    try {
      setCandidate(await api.getCandidate(id));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (error) return <div className="error-box">{error}</div>;
  if (!candidate) return <p className="muted">Loading…</p>;

  return (
    <div>
      <Link to="/" className="muted">
        ← Back to candidates
      </Link>

      <div className="detail-header">
        <div>
          <h1>{candidate.name}</h1>
          <p className="muted">
            {candidate.email} · applied for {candidate.role_applied}
          </p>
        </div>
        <span className={`status status-${candidate.status}`}>
          {candidate.status}
        </span>
      </div>

      <div className="skills-row">
        {candidate.skills.map((s) => (
          <span key={s} className="chip">
            {s}
          </span>
        ))}
      </div>

      <SummarySection candidate={candidate} onUpdated={load} />

      <Scores
        candidate={candidate}
        isAdmin={isAdmin}
        onScored={load}
      />

      {isAdmin && <InternalNotes candidate={candidate} onSaved={load} />}
    </div>
  );
}

function SummarySection({ candidate, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(candidate.summary);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.generateSummary(candidate.id);
      setSummary(res.summary);
      onUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>AI Summary</h2>
        <button onClick={generate} disabled={loading}>
          {loading ? "Generating…" : summary ? "Regenerate" : "Generate summary"}
        </button>
      </div>

      {loading && (
        <p className="muted">
          <span className="spinner" /> Talking to the model, this takes a couple
          of seconds…
        </p>
      )}
      {error && <div className="error-box">Could not generate summary: {error}</div>}
      {!loading && !error && summary && <p className="summary-text">{summary}</p>}
      {!loading && !error && !summary && (
        <p className="muted">No summary yet. Generate one to see it here.</p>
      )}
    </section>
  );
}

function Scores({ candidate, isAdmin, onScored }) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [score, setScore] = useState(3);
  const [note, setNote] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.submitScore(candidate.id, {
        category,
        score: Number(score),
        note: note || null,
      });
      setNote("");
      onScored();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <h2>
        Scores{" "}
        <span className="muted small">
          ({isAdmin ? "all reviewers" : "your scores only"})
        </span>
      </h2>

      {candidate.scores.length === 0 ? (
        <p className="muted">No scores recorded yet.</p>
      ) : (
        <ul className="score-list">
          {candidate.scores.map((s) => (
            <li key={s.id}>
              <span className="score-pill">{s.score}/5</span>
              <strong>{s.category}</strong>
              {s.note && <span className="muted"> — {s.note}</span>}
              {isAdmin && (
                <span className="muted small"> · reviewer #{s.reviewer_id}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      <form className="score-form" onSubmit={submit}>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={score} onChange={(e) => setScore(e.target.value)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <input
          placeholder="Optional note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Add score"}
        </button>
      </form>
      {error && <div className="error-box">{error}</div>}
    </section>
  );
}

function InternalNotes({ candidate, onSaved }) {
  const [notes, setNotes] = useState(candidate.internal_notes || "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await api.updateNotes(candidate.id, notes);
      setSaved(true);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel admin-panel">
      <h2>
        Internal notes <span className="role-badge">admin only</span>
      </h2>
      <textarea
        rows={4}
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          setSaved(false);
        }}
        placeholder="Notes visible to admins only…"
      />
      <div className="notes-actions">
        <button onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save notes"}
        </button>
        {saved && <span className="muted">Saved ✓</span>}
        {error && <span className="error-box">{error}</span>}
      </div>
    </section>
  );
}
