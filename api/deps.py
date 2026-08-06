from fastapi import Request, HTTPException
from jose import JWTError
from supabase import create_client, Client
from api.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
from api.lib.jwt import verify_access_token

# Cached singleton clients — avoids re-creating on every request (major perf win)
_admin_client: Client | None = None
_anon_client: Client | None = None


def get_supabase_admin() -> Client:
    """Supabase client with service role key (admin access, bypasses RLS). Cached."""
    global _admin_client
    if _admin_client is None:
        _admin_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    return _admin_client


def get_supabase() -> Client:
    """Supabase client with anon key (RLS enforced). Cached."""
    global _anon_client
    if _anon_client is None:
        _anon_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    return _anon_client


async def get_current_user(request: Request) -> dict:
    """Extract and verify the app's own JWT from the Authorization header."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = auth_header.split(" ")[1]

    try:
        claims = verify_access_token(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return {
        "id": claims["sub"],
        "email": claims.get("email"),
        "role": claims.get("app_role"),
    }
