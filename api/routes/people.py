from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from api.deps import get_supabase_admin, get_current_user

router = APIRouter()


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    avatar_url: Optional[str] = None


@router.get("/")
async def list_people(current_user: dict = Depends(get_current_user)):
    """List all team members."""
    supabase = get_supabase_admin()
    result = supabase.table("profiles").select("*").order("full_name").execute()
    return result.data or []


@router.get("/{user_id}")
async def get_person(user_id: str, current_user: dict = Depends(get_current_user)):
    """Get a single user profile."""
    supabase = get_supabase_admin()
    result = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    return result.data


@router.patch("/{user_id}")
async def update_person(user_id: str, body: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    """Update a user profile (admin or self only)."""
    supabase = get_supabase_admin()

    # Check if admin or updating own profile
    if current_user["id"] != user_id:
        profile = supabase.table("profiles").select("role").eq("id", current_user["id"]).single().execute()
        if not profile.data or profile.data.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")

    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = supabase.table("profiles").update(updates).eq("id", user_id).execute()
    return result.data[0] if result.data else {}
