"""Shared constants - roles, statuses and the few magic numbers the API uses.

Keeping these in one place means the models, schemas, services and seed data
all agree on the same values instead of repeating string literals.
"""

from enum import Enum


class Role(str, Enum):
    ADMIN = "admin"
    REVIEWER = "reviewer"


class CandidateStatus(str, Enum):
    NEW = "new"
    REVIEWED = "reviewed"
    HIRED = "hired"
    REJECTED = "rejected"
    # archived is the soft-delete state - hidden from the default listing
    ARCHIVED = "archived"


# statuses a candidate can be created with (everything except the soft-delete one)
CREATABLE_STATUSES = (
    CandidateStatus.NEW,
    CandidateStatus.REVIEWED,
    CandidateStatus.HIRED,
    CandidateStatus.REJECTED,
)

# pagination defaults for the candidate list
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 50

# scores are submitted on a 1-5 scale
MIN_SCORE = 1
MAX_SCORE = 5
