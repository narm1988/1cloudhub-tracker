from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from api.deps import get_supabase_admin, get_current_user

router = APIRouter()


class EpicCreate(BaseModel):
    title: str
    description: Optional[str] = None
    project_id: Optional[str] = None


class EpicUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    owner_id: Optional[str] = None


@router.get("/")
async def list_epics(current_user: dict = Depends(get_current_user)):
    """List all epics the user has access to."""
    supabase = get_supabase_admin()
    result = supabase.table("epics").select(
        "*, owner:profiles!epics_owner_id_fkey(id, full_name, email)"
    ).order("created_at", desc=True).execute()
    return result.data or []


@router.get("/{epic_id}")
async def get_epic(epic_id: str, current_user: dict = Depends(get_current_user)):
    """Get a single epic by ID."""
    supabase = get_supabase_admin()
    result = supabase.table("epics").select(
        "*, owner:profiles!epics_owner_id_fkey(id, full_name, email)"
    ).eq("id", epic_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Epic not found")
    return result.data


@router.post("/")
async def create_epic(body: EpicCreate, current_user: dict = Depends(get_current_user)):
    """Create a new epic."""
    supabase = get_supabase_admin()
    result = supabase.table("epics").insert({
        "title": body.title,
        "description": body.description,
        "owner_id": current_user["id"],
        "project_id": body.project_id,
        "status": "Created",
    }).execute()
    return result.data[0] if result.data else {}


@router.patch("/{epic_id}")
async def update_epic(epic_id: str, body: EpicUpdate, current_user: dict = Depends(get_current_user)):
    """Update an epic."""
    supabase = get_supabase_admin()
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = supabase.table("epics").update(updates).eq("id", epic_id).execute()
    return result.data[0] if result.data else {}


@router.delete("/{epic_id}")
async def delete_epic(epic_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an epic (admin only)."""
    supabase = get_supabase_admin()
    # Check admin
    profile = supabase.table("profiles").select("role").eq("id", current_user["id"]).single().execute()
    if not profile.data or profile.data.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete epics")

    supabase.table("epics").delete().eq("id", epic_id).execute()
    return {"message": "Epic deleted"}
