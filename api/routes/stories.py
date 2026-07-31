from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from api.deps import get_supabase_admin, get_current_user

router = APIRouter()


class StoryCreate(BaseModel):
    epic_id: str
    title: str
    description: Optional[str] = None
    type: str = "Story"
    status: str = "Created"
    priority: str = "Medium"
    assignee_id: Optional[str] = None


class StoryUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee_id: Optional[str] = None
    type: Optional[str] = None


@router.get("/")
async def list_stories(epic_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """List stories, optionally filtered by epic."""
    supabase = get_supabase_admin()
    query = supabase.table("stories").select(
        "*, assignee:profiles!stories_assignee_id_fkey(id, full_name, email), reporter:profiles!stories_reporter_id_fkey(id, full_name, email)"
    )
    if epic_id:
        query = query.eq("epic_id", epic_id)
    result = query.order("created_at", desc=True).execute()
    return result.data or []


@router.get("/{story_id}")
async def get_story(story_id: str, current_user: dict = Depends(get_current_user)):
    """Get a single story."""
    supabase = get_supabase_admin()
    result = supabase.table("stories").select(
        "*, assignee:profiles!stories_assignee_id_fkey(id, full_name, email), reporter:profiles!stories_reporter_id_fkey(id, full_name, email)"
    ).eq("id", story_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Story not found")
    return result.data


@router.post("/")
async def create_story(body: StoryCreate, current_user: dict = Depends(get_current_user)):
    """Create a new story/task."""
    supabase = get_supabase_admin()

    # Generate display ID
    count_result = supabase.table("stories").select("id", count="exact").execute()
    story_number = (count_result.count or 0) + 1
    display_id = f"1CH-{100 + story_number}"

    result = supabase.table("stories").insert({
        "epic_id": body.epic_id,
        "title": body.title,
        "description": body.description,
        "type": body.type,
        "status": body.status,
        "priority": body.priority,
        "assignee_id": body.assignee_id,
        "reporter_id": current_user["id"],
        "display_id": display_id,
    }).execute()
    return result.data[0] if result.data else {}


@router.patch("/{story_id}")
async def update_story(story_id: str, body: StoryUpdate, current_user: dict = Depends(get_current_user)):
    """Update a story."""
    supabase = get_supabase_admin()
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = supabase.table("stories").update(updates).eq("id", story_id).execute()
    return result.data[0] if result.data else {}


@router.delete("/{story_id}")
async def delete_story(story_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a story."""
    supabase = get_supabase_admin()
    supabase.table("stories").delete().eq("id", story_id).execute()
    return {"message": "Story deleted"}
