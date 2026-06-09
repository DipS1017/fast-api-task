import asyncio

from sqlalchemy import String, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Candidate, Score

# statuses a candidate can be in. "archived" is the soft-delete state and is
# hidden from the default listing.
ACTIVE_STATUSES = ("new", "reviewed", "hired", "rejected")


async def list_candidates(
    db: AsyncSession,
    *,
    status: str | None = None,
    role_applied: str | None = None,
    skill: str | None = None,
    keyword: str | None = None,
    offset: int = 0,
    limit: int = 20,
) -> tuple[list[Candidate], int]:
    """Filter + paginate in the database, not in Python.

    Every filter is pushed down to SQL and we only pull back one page worth of
    rows. The count query runs against the same filters so the frontend can
    render an accurate page count.
    """
    stmt = select(Candidate)

    if status:
        stmt = stmt.where(Candidate.status == status)
    else:
        # don't surface archived (soft-deleted) candidates by default
        stmt = stmt.where(Candidate.status != "archived")

    if role_applied:
        stmt = stmt.where(Candidate.role_applied == role_applied)

    if keyword:
        like = f"%{keyword}%"
        stmt = stmt.where(
            or_(Candidate.name.ilike(like), Candidate.email.ilike(like))
        )

    if skill:
        # skills is a JSON array; on SQLite we match against the serialised
        # text. Good enough for this dataset - see the README for the note on
        # doing this properly at scale.
        stmt = stmt.where(Candidate.skills.cast(String).ilike(f'%"{skill}"%'))

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    stmt = stmt.order_by(Candidate.created_at.desc()).offset(offset).limit(limit)
    rows = (await db.execute(stmt)).scalars().all()
    return list(rows), total


async def get_candidate(db: AsyncSession, candidate_id: int) -> Candidate | None:
    return await db.get(Candidate, candidate_id)


async def scores_for_candidate(
    db: AsyncSession, candidate_id: int, reviewer_id: int | None = None
) -> list[Score]:
    """Return scores for a candidate.

    When reviewer_id is passed we only return that reviewer's own scores -
    that's how we keep reviewers from peeking at each other's reviews. Admins
    call this with reviewer_id=None and get everything.
    """
    stmt = select(Score).where(Score.candidate_id == candidate_id)
    if reviewer_id is not None:
        stmt = stmt.where(Score.reviewer_id == reviewer_id)
    stmt = stmt.order_by(Score.created_at.desc())
    return list((await db.execute(stmt)).scalars().all())


async def add_score(
    db: AsyncSession,
    *,
    candidate_id: int,
    reviewer_id: int,
    category: str,
    score: int,
    note: str | None,
) -> Score:
    row = Score(
        candidate_id=candidate_id,
        reviewer_id=reviewer_id,
        category=category,
        score=score,
        note=note,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


async def generate_summary(
    db: AsyncSession, candidate: Candidate, scores: list[Score]
) -> str:
    """Pretend to call an LLM.

    A real implementation would await an httpx call to the model provider here.
    We sleep instead so the async behaviour (and the frontend loading state) is
    exercised end to end. asyncio.sleep yields the event loop, so other
    requests keep being served during the 2s wait.
    """
    await asyncio.sleep(2)

    avg = ""
    if scores:
        mean = sum(s.score for s in scores) / len(scores)
        avg = f" Current average score is {mean:.1f}/5 across {len(scores)} reviews."

    skills = ", ".join(candidate.skills) if candidate.skills else "no listed skills"
    text = (
        f"{candidate.name} applied for {candidate.role_applied} and brings "
        f"{skills}.{avg} Overall this looks like a candidate worth a closer "
        f"look from the panel."
    )

    candidate.summary = text
    await db.commit()
    return text


async def soft_delete(db: AsyncSession, candidate: Candidate) -> None:
    # never actually drop the row - we just archive it
    candidate.status = "archived"
    await db.commit()
