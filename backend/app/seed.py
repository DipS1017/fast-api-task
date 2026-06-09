"""Seed a few demo rows so the app isn't empty on first run.

This is a dev convenience only and is gated behind SEED_DEMO_DATA. The two
demo passwords here are throwaway values for local use - nothing real lives in
this file.
"""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from .auth import hash_password
from .models import Candidate, User

DEMO_USERS = [
    ("admin@techkraft.io", "admin1234", "admin"),
    ("reviewer@techkraft.io", "review1234", "reviewer"),
]

DEMO_CANDIDATES = [
    {
        "name": "Aria Khanal",
        "email": "aria.khanal@gmail.com",
        "role_applied": "Backend Engineer",
        "status": "new",
        "skills": ["python", "fastapi", "postgres"],
        "internal_notes": "Strong referral from the platform team.",
    },
    {
        "name": "Bishal Thapa",
        "email": "bishal.thapa@outlook.com",
        "role_applied": "Frontend Engineer",
        "status": "reviewed",
        "skills": ["react", "typescript", "css"],
        "internal_notes": "Take-home was clean, schedule onsite.",
    },
    {
        "name": "Carmen Diaz",
        "email": "carmen.diaz@gmail.com",
        "role_applied": "Backend Engineer",
        "status": "new",
        "skills": ["python", "django", "redis"],
        "internal_notes": None,
    },
    {
        "name": "Deepak Rai",
        "email": "deepak.rai@proton.me",
        "role_applied": "Full Stack Engineer",
        "status": "hired",
        "skills": ["react", "fastapi", "docker"],
        "internal_notes": "Accepted offer, starts next month.",
    },
]


async def seed_if_empty(db: AsyncSession) -> None:
    existing = (await db.execute(select(func.count()).select_from(User))).scalar_one()
    if existing:
        return

    for email, password, role in DEMO_USERS:
        db.add(
            User(email=email, password_hash=hash_password(password), role=role)
        )

    for c in DEMO_CANDIDATES:
        db.add(Candidate(**c))

    await db.commit()
