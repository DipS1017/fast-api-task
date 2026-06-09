# Candidate Review Dashboard

An internal tool for TechKraft's recruitment team. Reviewers score candidates
across categories and trigger AI summaries; admins get full visibility plus the
internal notes. Built with FastAPI + SQLite on the backend and React (Vite) on
the frontend, wired together with Docker Compose.

- **Backend:** FastAPI (async) on **port 8000**
- **Frontend:** React + Vite, built static and served by nginx on **port 5173**

---

## Running it

### Option A — Docker Compose (recommended)

```bash
docker compose up --build
```

Then open:

- Frontend: http://localhost:5173
- API docs (Swagger): http://localhost:8000/docs

The backend seeds two demo accounts and a handful of candidates on first boot:

| Role     | Email                  | Password   |
|----------|------------------------|------------|
| Admin    | admin@techkraft.io     | admin1234  |
| Reviewer | reviewer@techkraft.io  | review1234 |

> These are throwaway demo credentials for local use only. Real secrets belong
> in a `.env` file (see `backend/.env.example`) which is **not** committed.

### Option B — run the services directly

**Backend**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # adjust SECRET_KEY etc.
uvicorn app.main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
npm install
cp .env.example .env          # VITE_API_URL defaults to http://localhost:8000
npm run dev                    # serves on http://localhost:5173
```

### Tests

```bash
cd backend
pip install -r requirements.txt
pytest
```

---

## API overview

All `/candidates` routes require a bearer token (`Authorization: Bearer <token>`).

| Method | Path                          | Who         | Notes                                   |
|--------|-------------------------------|-------------|-----------------------------------------|
| POST   | `/auth/register`              | public      | always creates a **reviewer**           |
| POST   | `/auth/login`                 | public      | returns a JWT + role                    |
| GET    | `/auth/me`                    | any user    | current user                            |
| GET    | `/candidates`                 | any user    | filters + pagination                    |
| POST   | `/candidates`                 | admin       | create a candidate                      |
| GET    | `/candidates/{id}`            | any user    | reviewer sees own scores, admin sees all|
| POST   | `/candidates/{id}/scores`     | any user    | submit a 1–5 score for a category       |
| POST   | `/candidates/{id}/summary`    | any user    | mock AI summary (2s async delay)        |
| PATCH  | `/candidates/{id}/notes`      | admin       | edit internal notes                     |
| DELETE | `/candidates/{id}`            | admin       | **soft delete** (status → `archived`)   |
| GET    | `/candidates/{id}/stream`     | any user    | SSE score updates (stretch goal)        |

**List filters:** `status`, `role_applied`, `skill`, `keyword` (matches name or
email). **Pagination:** `offset` (default 0) + `limit` (default 20, max 50).

### Example curl session

```bash
# 1. log in as the admin and capture the token
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@techkraft.io","password":"admin1234"}' | jq -r .access_token)

# 2. list backend candidates, page size 10
curl -s "http://localhost:8000/candidates?role_applied=Backend%20Engineer&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq

# 3. keyword + skill filters
curl -s "http://localhost:8000/candidates?keyword=aria&skill=python" \
  -H "Authorization: Bearer $TOKEN" | jq

# 4. submit a score
curl -s -X POST http://localhost:8000/candidates/1/scores \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"category":"Technical","score":4,"note":"strong fundamentals"}' | jq

# 5. trigger the mock AI summary (takes ~2s)
curl -s -X POST http://localhost:8000/candidates/1/summary \
  -H "Authorization: Bearer $TOKEN" | jq

# 6. register a new reviewer - note the role is forced to "reviewer"
curl -s -X POST http://localhost:8000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"new.reviewer@gmail.com","password":"secret123","role":"admin"}' | jq
#    -> the "role":"admin" above is ignored; the account comes back as reviewer
```

---

## The debugging signal

The snippet from the hypothetical service layer:

```python
def search_candidates(status, keyword, page, page_size):
    all_candidates = db.execute("SELECT * FROM candidates").fetchall()
    filtered = [c for c in all_candidates if c["status"] == status]
    # ... also filter by keyword in Python ...
    offset = (page - 1) * page_size
    return filtered[offset : offset + page_size]
```

**The issue:** it pulls the *entire* `candidates` table into application memory on
every request (`SELECT *` with no `WHERE` and no `LIMIT`), then does the
filtering and the pagination slice in Python.

**Why it matters at scale:** the work is O(total rows) no matter which page you
ask for. With 10 candidates it's invisible; with 500k it means every request
serialises the whole table over the DB connection, allocates it all in memory,
and the indexes on `status` / `role_applied` are never used because the database
was never asked to filter. Two reviewers loading page 1 each drag the full table
across the wire. Latency and memory grow linearly with the table, and the DB
does the most expensive part (a full scan) regardless of `page_size`. It also
quietly breaks if rows change between requests.

**The correct approach:** push the filtering, ordering and pagination down into
SQL so the database does the work and returns only one page:

```sql
SELECT * FROM candidates
WHERE status = :status
  AND (name ILIKE :kw OR email ILIKE :kw)
ORDER BY created_at DESC
LIMIT :page_size OFFSET :offset;
```

With indexes on the filtered columns the DB touches a bounded number of rows and
ships back only `page_size` of them. That's exactly what
`services/candidate_service.list_candidates()` does in this project — every
filter is a `.where()` on the query and we run a matching `COUNT(*)` for the
total. For very deep pagination on huge tables, `OFFSET` itself gets slow (the DB
still walks the skipped rows), so the next step would be keyset / cursor
pagination (`WHERE created_at < :last_seen`).

---

## Architecture Decision Records

### ADR 1 — SQLite + async SQLAlchemy (not DynamoDB) for this build

- **Context:** the task allows a DynamoDB-style store or SQLite, and the core
  feature is *relational* filtering — list candidates by status/role/skill/keyword
  with an accurate total count, plus per-candidate scores owned by reviewers.
- **Decision:** SQLite through async SQLAlchemy 2.0 (`aiosqlite`), with indexes
  on `candidates.status`, `candidates.role_applied` and `scores.candidate_id`.
  It's zero-setup, runs the same in a container and in tests, and the ORM lets me
  express the filters as composable `WHERE` clauses.
- **Trade-off:** SQLite is single-writer and doesn't scale horizontally the way
  DynamoDB does. I'm accepting that because this is an internal tool with modest
  write volume. If this were going serverless I'd model it as a single DynamoDB
  table keyed on `candidate_id`, with GSIs on `status` and `role_applied` for the
  list views — but Dynamo can't do the ad-hoc keyword search cheaply, which would
  push that part to something like OpenSearch. SQLAlchemy keeps the swap to
  Postgres a connection-string change away.

### ADR 2 — Stateless JWT with the role baked into the token

- **Context:** two roles (reviewer/admin) gate both routes and what data comes
  back, and registration must never let a client choose its own role.
- **Decision:** email + password login returns a short-lived JWT carrying the
  user id and role. `register` hardcodes `role="reviewer"` and the schema doesn't
  even have a role field, so a forged `"role":"admin"` in the body is silently
  ignored. Admin-only routes sit behind a `require_admin` dependency, and data
  scoping (own scores vs all, internal notes) happens in the query layer, not the
  client.
- **Trade-off:** the token lives in `localStorage`, which is readable by JS so
  it's exposed to XSS. The more secure option is an httpOnly cookie, but that
  brings CSRF handling and complicates the local Docker story. For an internal
  tool with a short token TTL I took the simpler path and called it out here.

### ADR 3 — The "AI summary" is an awaited async stub, not a fake blocking sleep

- **Context:** the summary endpoint simulates a slow external LLM call, and the
  frontend has to stay responsive and show real loading/error states.
- **Decision:** the endpoint `await asyncio.sleep(2)` inside an `async def`
  service function — the same shape a real `await httpx.post(...)` to a model
  provider would have. Because it yields the event loop, the single uvicorn
  worker keeps serving other requests during the wait. The frontend shows a
  spinner while the request is in flight and an error box if it fails.
- **Trade-off:** it's still a stub — there's no retry/timeout/streaming that a
  production LLM integration needs, and the result is templated text rather than
  a real generation. I kept it deliberately small but structured it so swapping in
  a real async client is a one-function change.

---

## Things I'd do with more time / learning reflection

- I wired up an **SSE endpoint** (`/candidates/{id}/stream`) for the stretch
  goal, which I hadn't built from scratch in FastAPI before — it currently polls
  the DB once a second, and the honest production version would be backed by a
  pub/sub channel (Redis) instead of polling so it scales past a single worker.
- The **skill filter** matches against the JSON-serialised `skills` array with a
  `LIKE`, which works fine for this dataset but won't use an index. With more time
  I'd normalise skills into their own table (or move to Postgres and use a `GIN`
  index on a JSONB column) so that filter stays fast at scale.
- Given more time I'd also add **refresh tokens**, switch the JWT to an httpOnly
  cookie, and put **Alembic** migrations in front of the `create_all` I'm using
  to bootstrap the schema on startup.

---

## Notes on scope & honesty

- **Soft delete:** `DELETE /candidates/{id}` sets `status = "archived"` and the
  row is filtered out of the default listing and 404s on detail — nothing is ever
  hard-deleted.
- **No committed credentials:** there's no `.env` in the repo, only
  `.env.example` files with dummy values. The compose file uses a local-dev
  default secret that's meant to be overridden.
- **Schema bootstrap** uses `Base.metadata.create_all` on startup for simplicity;
  a real deployment would use Alembic migrations.
- Tests cover the happy-path API, the role-spoof guard, the reviewer-can't-see-
  others'-scores rule, hidden internal notes, and the soft delete.
