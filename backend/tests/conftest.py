import os

# don't wait the real two seconds for the mock summary during tests.
# must be set before the app (and its cached settings) are imported.
os.environ.setdefault("SUMMARY_DELAY_SECONDS", "0")

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.auth import hash_password
from app.database import Base, get_db
from app.main import app
from app.models import Candidate, User

# isolated in-memory db per test run so we never touch the real app.db
TEST_URL = "sqlite+aiosqlite:///./test.db"


@pytest_asyncio.fixture
async def session_maker():
    engine = create_async_engine(TEST_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    maker = async_sessionmaker(engine, expire_on_commit=False)
    yield maker

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def client(session_maker):
    async def override_get_db():
        async with session_maker() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def admin_token(client, session_maker):
    async with session_maker() as db:
        db.add(
            User(
                email="boss@techkraft.io",
                password_hash=hash_password("bosspass"),
                role="admin",
            )
        )
        await db.commit()
    resp = await client.post(
        "/auth/login", json={"email": "boss@techkraft.io", "password": "bosspass"}
    )
    return resp.json()["access_token"]


async def make_candidate(session_maker, **overrides) -> int:
    data = {
        "name": "Test Person",
        "email": "test.person@gmail.com",
        "role_applied": "Backend Engineer",
        "skills": ["python"],
        "status": "new",
    }
    data.update(overrides)
    async with session_maker() as db:
        candidate = Candidate(**data)
        db.add(candidate)
        await db.commit()
        await db.refresh(candidate)
        return candidate.id
