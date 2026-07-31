from fastapi import Request, HTTPException
from supabase import create_client, Client
from api.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY


def get_supabase_admin() -> Client:
    """Supabase client with service role key (admin access)."""
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def get_supabase() -> Client:
    """Supabase client with anon key (RLS enforced)."""
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


async def get_current_user(request: Request) -> dict:
    """Extract and verify user from Authorization header."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = auth_header.split(" ")[1]
    supabase = get_supabase_admin()

    try:
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {
            "id": user_response.user.id,
            "email": user_response.user.email,
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
