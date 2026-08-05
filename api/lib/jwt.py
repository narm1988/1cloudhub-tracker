"""
Mints and verifies the app's own JWTs. Signed with the RS256 key pair
registered as this Supabase project's JWT Signing Key (Dashboard →
Authentication → JWT Keys), so PostgREST/RLS trusts these tokens exactly
as if GoTrue had issued them — every existing `auth.uid()` policy keeps
working unmodified.
"""
from datetime import datetime, timedelta, timezone

from jose import jwt

from api.config import (
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
    JWT_AUDIENCE,
    JWT_ISSUER,
    JWT_KID,
    JWT_PRIVATE_KEY,
    JWT_PUBLIC_KEY,
)

ALGORITHM = "RS256"

# PostgREST reserves the "role" claim to decide which Postgres role to
# SET ROLE to for the request — it must always be "authenticated" (or
# "anon"/"service_role"), never an app-level value. Only "anon" and
# "authenticated" exist as real Postgres roles in a Supabase project;
# putting "admin"/"member" here would make every DB request for that user
# fail with "role admin does not exist". The app's own admin/member
# distinction goes in "app_role" instead — a plain custom claim RLS
# policies don't read (they re-derive it live from public.profiles) and
# that's only consumed by this backend's own permission checks.
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
    return jwt.encode(claims, JWT_PRIVATE_KEY, algorithm=ALGORITHM, headers={"kid": JWT_KID})


def verify_access_token(token: str) -> dict:
    """Raises jose.exceptions.JWTError if the token is invalid, expired, or mis-signed."""
    return jwt.decode(
        token,
        JWT_PUBLIC_KEY,
        algorithms=[ALGORITHM],
        audience=JWT_AUDIENCE,
        issuer=JWT_ISSUER,
    )
