from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .config import get_settings
from .constants import Role
from .database import get_db
from .messages import AuthMessages
from .models import User

settings = get_settings()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


ACCESS_TOKEN = "access"
REFRESH_TOKEN = "refresh"


def _create_token(user: User, *, minutes: int, token_type: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=minutes)
    payload = {
        "sub": str(user.id),
        "role": user.role,
        "type": token_type,
        "exp": expire,
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def create_access_token(user: User) -> str:
    return _create_token(
        user, minutes=settings.access_token_expire_minutes, token_type=ACCESS_TOKEN
    )


def create_refresh_token(user: User) -> str:
    return _create_token(
        user,
        minutes=settings.refresh_token_expire_minutes,
        token_type=REFRESH_TOKEN,
    )


async def _user_from_token(db: AsyncSession, token: str, expected_type: str) -> User:
    creds_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=AuthMessages.COULD_NOT_VALIDATE_CREDENTIALS,
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
    except JWTError:
        raise creds_error

    # an access token can't be used to refresh, nor a refresh token to call the API
    if payload.get("type") != expected_type or payload.get("sub") is None:
        raise creds_error

    user = await db.get(User, int(payload["sub"]))
    if user is None:
        raise creds_error
    return user


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    return await _user_from_token(db, token, ACCESS_TOKEN)


async def user_from_refresh_token(db: AsyncSession, token: str) -> User:
    return await _user_from_token(db, token, REFRESH_TOKEN)


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != Role.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=AuthMessages.ADMIN_ACCESS_REQUIRED,
        )
    return user


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()
