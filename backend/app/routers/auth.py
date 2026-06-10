from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import (
    create_access_token,
    create_refresh_token,
    get_current_user,
    get_user_by_email,
    hash_password,
    user_from_refresh_token,
    verify_password,
)
from ..constants import Role
from ..database import get_db
from ..messages import AuthMessages
from ..models import User
from ..schemas import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserOut,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _tokens_for(user: User) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(user),
        refresh_token=create_refresh_token(user),
        role=user.role,
    )


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await get_user_by_email(db, body.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=AuthMessages.EMAIL_ALREADY_REGISTERED,
        )

    # role is hardcoded here on purpose - the client can't make itself an admin.
    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        role=Role.REVIEWER,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return _tokens_for(user)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await get_user_by_email(db, body.email)
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=AuthMessages.INVALID_CREDENTIALS,
        )
    return _tokens_for(user)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    # swap a valid refresh token for a fresh pair (rotation). a bad/expired
    # refresh token 401s, which tells the client to send the user back to login.
    user = await user_from_refresh_token(db, body.refresh_token)
    return _tokens_for(user)


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)):
    return user
