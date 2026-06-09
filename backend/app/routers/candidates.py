import asyncio
import json

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import get_current_user, require_admin
from ..constants import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, CandidateStatus, Role
from ..database import get_db
from ..messages import CandidateMessages
from ..models import Candidate, User
from ..schemas import (
    CandidateCreate,
    CandidateDetail,
    CandidateListItem,
    NotesUpdate,
    PaginatedCandidates,
    ScoreCreate,
    ScoreOut,
    SummaryResponse,
)
from ..services import candidate_service as svc

router = APIRouter(prefix="/candidates", tags=["candidates"])


async def get_active_candidate(db: AsyncSession, candidate_id: int) -> Candidate:
    """Fetch a candidate or raise 404. Archived rows count as gone."""
    candidate = await svc.get_candidate(db, candidate_id)
    if candidate is None or candidate.status == CandidateStatus.ARCHIVED:
        raise HTTPException(status_code=404, detail=CandidateMessages.NOT_FOUND)
    return candidate


@router.get("", response_model=PaginatedCandidates)
async def list_candidates(
    status: str | None = None,
    role_applied: str | None = None,
    skill: str | None = None,
    keyword: str | None = None,
    offset: int = Query(0, ge=0),
    limit: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rows, total = await svc.list_candidates(
        db,
        status=status,
        role_applied=role_applied,
        skill=skill,
        keyword=keyword,
        offset=offset,
        limit=limit,
    )
    return PaginatedCandidates(
        items=[CandidateListItem.model_validate(r) for r in rows],
        total=total,
        offset=offset,
        limit=limit,
    )


@router.post("", response_model=CandidateDetail, status_code=201)
async def create_candidate(
    body: CandidateCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    candidate = Candidate(
        name=body.name,
        email=body.email,
        role_applied=body.role_applied,
        skills=body.skills,
        status=body.status,
        internal_notes=body.internal_notes,
    )
    db.add(candidate)
    await db.commit()
    await db.refresh(candidate)
    return _serialize_detail(candidate, scores=[], is_admin=True)


@router.get("/{candidate_id}", response_model=CandidateDetail)
async def get_candidate(
    candidate_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    candidate = await get_active_candidate(db, candidate_id)

    is_admin = user.role == Role.ADMIN
    # reviewers only ever see their own scores
    reviewer_filter = None if is_admin else user.id
    scores = await svc.scores_for_candidate(db, candidate_id, reviewer_filter)
    return _serialize_detail(candidate, scores=scores, is_admin=is_admin)


@router.post("/{candidate_id}/scores", response_model=ScoreOut, status_code=201)
async def submit_score(
    candidate_id: int,
    body: ScoreCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await get_active_candidate(db, candidate_id)

    score = await svc.add_score(
        db,
        candidate_id=candidate_id,
        reviewer_id=user.id,
        category=body.category,
        score=body.score,
        note=body.note,
    )
    return score


@router.post("/{candidate_id}/summary", response_model=SummaryResponse)
async def trigger_summary(
    candidate_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    candidate = await get_active_candidate(db, candidate_id)

    # pass scores in so the summary can mention the average without lazy-loading
    scores = await svc.scores_for_candidate(db, candidate_id)
    summary = await svc.generate_summary(db, candidate, scores)
    return SummaryResponse(candidate_id=candidate_id, summary=summary)


@router.patch("/{candidate_id}/notes", response_model=CandidateDetail)
async def update_notes(
    candidate_id: int,
    body: NotesUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    candidate = await get_active_candidate(db, candidate_id)

    candidate.internal_notes = body.internal_notes
    await db.commit()
    await db.refresh(candidate)
    scores = await svc.scores_for_candidate(db, candidate_id)
    return _serialize_detail(candidate, scores=scores, is_admin=True)


@router.delete("/{candidate_id}", status_code=204)
async def delete_candidate(
    candidate_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    candidate = await svc.get_candidate(db, candidate_id)
    if candidate is None:
        raise HTTPException(status_code=404, detail=CandidateMessages.NOT_FOUND)
    # soft delete only - we archive instead of dropping the row
    await svc.soft_delete(db, candidate)


@router.get("/{candidate_id}/stream")
async def stream_scores(
    candidate_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Stretch goal: push the latest score count over SSE.

    Polls the DB once a second and emits an event whenever a new score lands.
    A production build would replace the poll with a pub/sub channel.
    """
    await get_active_candidate(db, candidate_id)

    reviewer_filter = None if user.role == Role.ADMIN else user.id

    async def event_source():
        last_seen = -1
        while True:
            scores = await svc.scores_for_candidate(db, candidate_id, reviewer_filter)
            if len(scores) != last_seen:
                last_seen = len(scores)
                payload = {
                    "candidate_id": candidate_id,
                    "score_count": len(scores),
                    "latest": scores[0].category if scores else None,
                }
                yield f"data: {json.dumps(payload)}\n\n"
            await asyncio.sleep(1)

    return StreamingResponse(event_source(), media_type="text/event-stream")


def _serialize_detail(candidate, *, scores, is_admin: bool) -> CandidateDetail:
    return CandidateDetail(
        id=candidate.id,
        name=candidate.name,
        email=candidate.email,
        role_applied=candidate.role_applied,
        status=candidate.status,
        skills=candidate.skills or [],
        created_at=candidate.created_at,
        summary=candidate.summary,
        scores=[ScoreOut.model_validate(s) for s in scores],
        internal_notes=candidate.internal_notes if is_admin else None,
    )
