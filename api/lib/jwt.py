"""
Mints and verifies the app's own JWTs using HS256 with the Supabase JWT
secret. PostgREST/RLS trusts these tokens exactly as if GoTrue had issued
them — every existing `auth.uid()` policy keeps working unmodified.
"""
from datetime import datetime, timedelta, timezone

from jose import jwt

from api.config import (
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
    JWT_AUDIENCE,
    JWT_ISSUER,
    JWT_SECRET,
)

ALGORITHM = "HS256"

POSTGREST_ROLE = "authenticated"


def create_access_token(user_id: str, email: str, app_role: str) -> str:
    now = datetime.now(timezone.utc)
    claims = {
        "sub": user_id,
        "email": email,
        "role": POSTGREST_ROLE,
        "app_role": app_role,
        "iss": JWT_ISSUER,
        "aud": JWT_AUDIENCE,
        "iat": now,
        "exp": now + timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(claims, JWT_SECRET, algorithm=ALGORITHM)


def verify_access_token(token: str) -> dict:
    """Raises jose.exceptions.JWTError if the token is invalid, expired, or mis-signed."""
    return jwt.decode(
        token,
        JWT_SECRET,
        algorithms=[ALGORITHM],
        audience=JWT_AUDIENCE,
        issuer=JWT_ISSUER,
    )
