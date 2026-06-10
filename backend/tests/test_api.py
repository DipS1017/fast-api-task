import pytest

from .conftest import make_candidate

pytestmark = pytest.mark.asyncio


async def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def register_reviewer(client, email: str, password: str = "secret123") -> str:
    resp = await client.post(
        "/auth/register", json={"email": email, "password": password}
    )
    assert resp.status_code == 201
    return resp.json()["access_token"]


async def test_filters_are_partial_and_case_insensitive(
    client, session_maker, admin_token
):
    await make_candidate(
        session_maker,
        name="Backend Person",
        email="be@gmail.com",
        role_applied="Backend Engineer",
        skills=["python", "fastapi"],
    )
    await make_candidate(
        session_maker,
        name="Frontend Person",
        email="fe@gmail.com",
        role_applied="Frontend Engineer",
        skills=["react", "typescript"],
    )

    async def names(query):
        resp = await client.get(
            f"/candidates?{query}", headers=await auth_header(admin_token)
        )
        return sorted(c["name"] for c in resp.json()["items"])

    # role_applied is a partial, case-insensitive match (not exact equality)
    assert await names("role_applied=backend") == ["Backend Person"]
    assert await names("role_applied=ENGINEER") == [
        "Backend Person",
        "Frontend Person",
    ]
    # skill matches a partial token too
    assert await names("skill=rea") == ["Frontend Person"]
    assert await names("skill=PYTHON") == ["Backend Person"]


async def test_admin_can_create_candidate(client, admin_token):
    resp = await client.post(
        "/candidates",
        headers=await auth_header(admin_token),
        json={
            "name": "Nora Lee",
            "email": "nora.lee@gmail.com",
            "role_applied": "Frontend Engineer",
            "skills": ["react", "typescript"],
            "internal_notes": "promising",
        },
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Nora Lee"
    assert body["role_applied"] == "Frontend Engineer"
    assert body["skills"] == ["react", "typescript"]
    # admin gets the internal notes back
    assert body["internal_notes"] == "promising"


async def test_cannot_create_candidate_as_archived(client, admin_token):
    # archived is the soft-delete state, not something you can create directly
    resp = await client.post(
        "/candidates",
        headers=await auth_header(admin_token),
        json={
            "name": "Ghost",
            "email": "ghost@gmail.com",
            "role_applied": "QA",
            "status": "archived",
        },
    )
    assert resp.status_code == 422


async def test_summary_endpoint_returns_text(client, session_maker):
    candidate_id = await make_candidate(session_maker)
    reviewer = await register_reviewer(client, "summary@gmail.com")
    resp = await client.post(
        f"/candidates/{candidate_id}/summary", headers=await auth_header(reviewer)
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["candidate_id"] == candidate_id
    assert len(body["summary"]) > 0


async def test_register_always_creates_reviewer(client):
    # even if a sneaky client passes role=admin, it must be ignored
    resp = await client.post(
        "/auth/register",
        json={"email": "sneaky@gmail.com", "password": "secret123", "role": "admin"},
    )
    assert resp.status_code == 201
    token = resp.json()["access_token"]

    me = await client.get("/auth/me", headers=await auth_header(token))
    assert me.json()["role"] == "reviewer"


async def test_reviewer_only_sees_own_scores(client, session_maker):
    candidate_id = await make_candidate(session_maker)

    alice = await register_reviewer(client, "alice@gmail.com")
    bob = await register_reviewer(client, "bob@gmail.com")

    # both reviewers score the same candidate
    await client.post(
        f"/candidates/{candidate_id}/scores",
        headers=await auth_header(alice),
        json={"category": "Technical", "score": 5, "note": "great"},
    )
    await client.post(
        f"/candidates/{candidate_id}/scores",
        headers=await auth_header(bob),
        json={"category": "Communication", "score": 3},
    )

    # alice should only see her own score, not bob's
    detail = await client.get(
        f"/candidates/{candidate_id}", headers=await auth_header(alice)
    )
    categories = [s["category"] for s in detail.json()["scores"]]
    assert categories == ["Technical"]
    assert "Communication" not in categories


async def test_admin_sees_all_scores_reviewer_hidden_notes(client, session_maker, admin_token):
    candidate_id = await make_candidate(
        session_maker, internal_notes="admin eyes only"
    )
    reviewer = await register_reviewer(client, "rev@gmail.com")
    await client.post(
        f"/candidates/{candidate_id}/scores",
        headers=await auth_header(reviewer),
        json={"category": "Technical", "score": 4},
    )

    # reviewer cannot see internal notes
    as_reviewer = await client.get(
        f"/candidates/{candidate_id}", headers=await auth_header(reviewer)
    )
    assert as_reviewer.json()["internal_notes"] is None

    # admin sees the note and the reviewer's score
    as_admin = await client.get(
        f"/candidates/{candidate_id}", headers=await auth_header(admin_token)
    )
    assert as_admin.json()["internal_notes"] == "admin eyes only"
    assert len(as_admin.json()["scores"]) == 1


async def test_reviewer_cannot_create_candidate(client):
    reviewer = await register_reviewer(client, "plainreviewer@gmail.com")
    resp = await client.post(
        "/candidates",
        headers=await auth_header(reviewer),
        json={"name": "X", "email": "x@gmail.com", "role_applied": "QA"},
    )
    assert resp.status_code == 403


async def test_delete_is_soft_delete(client, session_maker, admin_token):
    candidate_id = await make_candidate(session_maker)
    resp = await client.delete(
        f"/candidates/{candidate_id}", headers=await auth_header(admin_token)
    )
    assert resp.status_code == 204

    # archived candidates 404 on detail and drop out of the default list
    detail = await client.get(
        f"/candidates/{candidate_id}", headers=await auth_header(admin_token)
    )
    assert detail.status_code == 404

    listing = await client.get("/candidates", headers=await auth_header(admin_token))
    ids = [c["id"] for c in listing.json()["items"]]
    assert candidate_id not in ids
