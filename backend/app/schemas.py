from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

# ---- auth ----


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    # note: role is intentionally NOT here. new accounts are always reviewers.


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    role: str


# ---- scores ----


class ScoreCreate(BaseModel):
    category: str = Field(min_length=1, max_length=80)
    score: int = Field(ge=1, le=5)
    note: Optional[str] = None


class ScoreOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    candidate_id: int
    category: str
    score: int
    reviewer_id: int
    note: Optional[str]
    created_at: datetime


# ---- candidates ----


class CandidateListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role_applied: str
    status: str
    skills: list[str]
    created_at: datetime


class CandidateDetail(CandidateListItem):
    summary: Optional[str] = None
    scores: list[ScoreOut] = []
    # only populated for admins, stays None for reviewers
    internal_notes: Optional[str] = None


class CandidateCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    email: EmailStr
    role_applied: str
    skills: list[str] = []
    status: Literal["new", "reviewed", "hired", "rejected"] = "new"
    internal_notes: Optional[str] = None


class NotesUpdate(BaseModel):
    internal_notes: str


class PaginatedCandidates(BaseModel):
    items: list[CandidateListItem]
    total: int
    offset: int
    limit: int


class SummaryResponse(BaseModel):
    candidate_id: int
    summary: str
