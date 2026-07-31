from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from api.deps import get_supabase_admin, get_current_user

router = APIRouter()


class InviteRequest(BaseModel):
    email: EmailStr
    role: str = "member"


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str


@router.post("/invite")
async def invite_user(body: InviteRequest, current_user: dict = Depends(get_current_user)):
    """Admin-only: Invite a user via email. Creates a Supabase auth invite."""
    supabase = get_supabase_admin()

    # Check if current user is admin
    profile = supabase.table("profiles").select("role").eq("id", current_user["id"]).single().execute()
    if not profile.data or profile.data.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can invite users")

    # Send magic link / invite via Supabase
    try:
        result = supabase.auth.admin.invite_user_by_email(body.email)
        # Record the invite
        supabase.table("invites").insert({
            "email": body.email,
            "role": body.role,
            "invited_by": current_user["id"],
        }).execute()

        return {"message": f"Invite sent to {body.email}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/signup")
async def sign_up(body: SignUpRequest):
    """Create a new user account (used after accepting invite)."""
    supabase = get_supabase_admin()

    try:
        # Create auth user
        result = supabase.auth.admin.create_user({
            "email": body.email,
            "password": body.password,
            "email_confirm": True,
        })

        if result.user:
            # Create profile
            supabase.table("profiles").insert({
                "id": result.user.id,
                "email": body.email,
                "full_name": body.full_name,
                "role": "member",
            }).execute()

            return {"message": "Account created", "user_id": result.user.id}

        raise HTTPException(status_code=400, detail="Failed to create user")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user profile."""
    supabase = get_supabase_admin()
    profile = supabase.table("profiles").select("*").eq("id", current_user["id"]).single().execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile.data
