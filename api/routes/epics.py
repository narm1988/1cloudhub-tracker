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


_SELECT = "*, owner:profiles!epics_owner_id_fkey(id, full_name, email), project:projects(id, name, key)"


@router.get("/")
async def list_epics(page: int = 1, page_size: int = 12, archived: bool = False, current_user: dict = Depends(get_current_user)):
    """List epics, paginated. By default excludes archived."""
    supabase = get_supabase_admin()
    from_ = (page - 1) * page_size
    to = from_ + page_size - 1
    query = supabase.table("epics").select(_SELECT, count="exact")
    if archived:
        query = query.eq("archived", True)
    else:
        query = query.or_("archived.is.null,archived.eq.false")
    result = query.order("created_at", desc=True).range(from_, to).execute()
    return {"data": result.data or [], "total": result.count or 0}


@router.get("/{epic_id}")
async def get_epic(epic_id: str, current_user: dict = Depends(get_current_user)):
    """Get a single epic by ID."""
    supabase = get_supabase_admin()
    result = supabase.table("epics").select(_SELECT).eq("id", epic_id).single().execute()
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
    updates = body.model_dump(exclude_unset=True)
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


@router.post("/{epic_id}/move-to-backlog")
async def move_epic_to_backlog(epic_id: str, current_user: dict = Depends(get_current_user)):
    """Unschedules every story under this epic, and every issue under those
    stories, from whatever sprint they're in. Bulk server-side operation —
    the frontend used to do this as two separate Supabase bulk updates."""
    supabase = get_supabase_admin()

    stories = supabase.table("stories").select("id").eq("epic_id", epic_id).execute()
    story_ids = [s["id"] for s in (stories.data or [])]

    supabase.table("stories").update({"sprint_id": None}).eq("epic_id", epic_id).execute()
    if story_ids:
        supabase.table("issues").update({"sprint_id": None}).in_("story_id", story_ids).execute()

    return {"message": "Moved to backlog", "story_count": len(story_ids)}


@router.post("/{epic_id}/archive")
async def archive_epic(epic_id: str, current_user: dict = Depends(get_current_user)):
    """Archive an epic."""
    supabase = get_supabase_admin()
    result = supabase.table("epics").update({"archived": True}).eq("id", epic_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Epic not found")
    return {"message": "Epic archived"}


@router.post("/{epic_id}/unarchive")
async def unarchive_epic(epic_id: str, current_user: dict = Depends(get_current_user)):
    """Unarchive an epic."""
    supabase = get_supabase_admin()
    result = supabase.table("epics").update({"archived": False}).eq("id", epic_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Epic not found")
    return {"message": "Epic unarchived"}
