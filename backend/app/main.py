from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .database import Base, SessionLocal, engine
from .routers import auth, candidates
from .seed import seed_if_empty

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # create tables on boot. for a real deployment this would be Alembic.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    if settings.seed_demo_data:
        async with SessionLocal() as db:
            await seed_if_empty(db)

    yield


app = FastAPI(title="TechKraft Candidate Review API", version="1.0.0", lifespan=lifespan)

# the Vite dev server runs on 5173; allow it during local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(candidates.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
