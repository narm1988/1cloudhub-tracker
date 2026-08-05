import secrets
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext

from api.config import ENTRA_ADMIN_GROUP_ID, FRONTEND_URL
from api.deps import get_current_user, get_supabase_admin
from api.lib.email import send_invite_email
from api.lib.entra import acquire_token, get_auth_url
from api.lib.jwt import create_access_token

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class InviteRequest(BaseModel):
    email: EmailStr
    role: str = "member"


class AcceptInviteRequest(BaseModel):
    token: str
    password: str
    full_name: str


def _public_profile(row: dict) -> dict:
    return {
        "id": row["id"],
        "email": row["email"],
        "full_name": row["full_name"],
        "avatar_url": row.get("avatar_url"),
        "role": row["role"],
    }


@router.post("/login")
async def login(body: LoginRequest):
    """Password sign-in — verifies against profiles.password_hash directly.
    No Supabase Auth involved."""
    supabase = get_supabase_admin()
    profile = supabase.table("profiles").select("*").eq("email", body.email).maybe_single().execute()

    if not profile.data or not profile.data.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not pwd_context.verify(body.password, profile.data["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(profile.data["id"], profile.data["email"], profile.data["role"])
    return {"access_token": token, "user": _public_profile(profile.data)}


@router.get("/entra/login")
async def entra_login():
    """Redirects to Microsoft's authorize endpoint. This backend is
    stateless, so `state` only needs to be present, not looked up later."""
    state = secrets.token_urlsafe(16)
    return RedirectResponse(get_auth_url(state))


@router.get("/entra/callback")
async def entra_callback(code: Optional[str] = None, error: Optional[str] = None):
    if error or not code:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=entra_sign_in_failed")

    try:
        result = acquire_token(code)
    except ValueError:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=entra_sign_in_failed")

    claims = result.get("id_token_claims", {})
    email = claims.get("preferred_username") or claims.get("email")
    if not email:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=entra_sign_in_failed")

    full_name = claims.get("name") or email.split("@")[0]
    groups = claims.get("groups", [])
    role = "admin" if ENTRA_ADMIN_GROUP_ID and ENTRA_ADMIN_GROUP_ID in groups else "member"

    supabase = get_supabase_admin()
    existing = supabase.table("profiles").select("*").eq("email", email).maybe_single().execute()

    if existing.data:
        # Group membership is re-checked on every sign-in, so removing
        # someone from the admin group demotes them on their next login.
        updated = supabase.table("profiles").update({"role": role}).eq("id", existing.data["id"]).execute()
        profile = updated.data[0]
    else:
        created = supabase.table("profiles").insert({
            "email": email,
            "full_name": full_name,
            "role": role,
        }).execute()
        profile = created.data[0]

    token = create_access_token(profile["id"], profile["email"], profile["role"])
    return RedirectResponse(f"{FRONTEND_URL}/auth/callback#token={token}")


@router.post("/invite")
async def invite_user(body: InviteRequest, current_user: dict = Depends(get_current_user)):
    """Admin-only: create an invite record and email a signup link via SES."""
    supabase = get_supabase_admin()

    profile = supabase.table("profiles").select("role").eq("id", current_user["id"]).single().execute()
    if not profile.data or profile.data.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can invite users")

    invite_token = secrets.token_urlsafe(32)
    supabase.table("invites").insert({
        "email": body.email,
        "role": body.role,
        "invited_by": current_user["id"],
        "token": invite_token,
    }).execute()

    invite_link = f"{FRONTEND_URL}/accept-invite?token={invite_token}"
    try:
        send_invite_email(body.email, invite_link)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Invite created but email failed to send: {e}")

    return {"message": f"Invite sent to {body.email}"}


@router.post("/accept-invite")
async def accept_invite(body: AcceptInviteRequest):
    supabase = get_supabase_admin()

    invite = (
        supabase.table("invites")
        .select("*")
        .eq("token", body.token)
        .eq("accepted", False)
        .maybe_single()
        .execute()
    )
    if not invite.data:
        raise HTTPException(status_code=400, detail="Invite link is invalid or has already been used")

    # expires_at is a plain column check, not RLS — fine to compare in Python
    # since this endpoint already runs with the service-role client.
    # .replace("Z", "+00:00") because datetime.fromisoformat() only accepts
    # a trailing "Z" on Python 3.11+, and the deployed runtime's exact
    # version isn't guaranteed.
    expires_at = invite.data.get("expires_at")
    if expires_at:
        expires_dt = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
        if expires_dt < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Invite link has expired")

    password_hash = pwd_context.hash(body.password)
    created = supabase.table("profiles").insert({
        "email": invite.data["email"],
        "full_name": body.full_name,
        "role": invite.data["role"],
        "password_hash": password_hash,
    }).execute()
    profile = created.data[0]

    supabase.table("invites").update({"accepted": True}).eq("id", invite.data["id"]).execute()

    token = create_access_token(profile["id"], profile["email"], profile["role"])
    return {"access_token": token, "user": _public_profile(profile)}


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_admin()
    profile = supabase.table("profiles").select("*").eq("id", current_user["id"]).single().execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return _public_profile(profile.data)


@router.post("/logout")
async def logout():
    """Stateless JWT — nothing to invalidate server-side yet. Kept for
    symmetry and as the place to add a token blocklist later if needed."""
    return {"message": "Signed out"}
