from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from api.deps import get_supabase_admin, get_current_user
from api.lib.display_id import create_with_display_id

router = APIRouter()


class StoryCreate(BaseModel):
    epic_id: str
    title: str
    description: Optional[str] = None
    type: str = "Story"
    status: str = "Created"
    priority: str = "Medium"
    assignee_id: Optional[str] = None
    story_points: Optional[int] = None
    start_date: Optional[str] = None
    due_date: Optional[str] = None


class StoryUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee_id: Optional[str] = None
    type: Optional[str] = None
    story_points: Optional[int] = None
    start_date: Optional[str] = None
    due_date: Optional[str] = None
    sprint_id: Optional[str] = None


@router.get("/")
async def list_stories(
    epic_id: Optional[str] = None,
    project_id: Optional[str] = None,
    has_sprint: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """List stories, optionally filtered by epic, project, or sprint status."""
    supabase = get_supabase_admin()
    query = supabase.table("stories").select(
        "*, assignee:profiles!stories_assignee_id_fkey(id, full_name, email), reporter:profiles!stories_reporter_id_fkey(id, full_name, email)"
    )
    if epic_id:
        query = query.eq("epic_id", epic_id)
    if project_id:
        query = query.eq("project_id", project_id)
    if has_sprint == "yes":
        query = query.not_("sprint_id", "is", "null")
    elif has_sprint == "no":
        query = query.is_("sprint_id", "null")
    result = query.order("created_at", desc=True).execute()
    return result.data or []


@router.get("/backlog")
async def list_backlog_stories(
    project_id: str,
    page: int = 1,
    page_size: int = 10,
    current_user: dict = Depends(get_current_user),
):
    """Paginated list of stories with no sprint assignment (backlog)."""
    supabase = get_supabase_admin()
    offset = (page - 1) * page_size
    query = (
        supabase.table("stories")
        .select(
            "*, assignee:profiles!stories_assignee_id_fkey(id, full_name, email)",
            count="exact",
        )
        .eq("project_id", project_id)
        .is_("sprint_id", "null")
        .order("created_at", desc=True)
        .range(offset, offset + page_size - 1)
    )
    result = query.execute()
    return {"data": result.data or [], "total": result.count or 0}


@router.get("/{story_id}")
async def get_story(story_id: str, current_user: dict = Depends(get_current_user)):
    """Get a single story by UUID or display_id (e.g. 1CH-112)."""
    supabase = get_supabase_admin()
    select = "*, assignee:profiles!stories_assignee_id_fkey(id, full_name, email), reporter:profiles!stories_reporter_id_fkey(id, full_name, email)"

    # If it looks like a display_id (contains a dash and doesn't look like UUID)
    if "-" in story_id and len(story_id) < 20:
        result = supabase.table("stories").select(select).eq("display_id", story_id.upper()).maybe_single().execute()
    else:
        result = supabase.table("stories").select(select).eq("id", story_id).maybe_single().execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Story not found")
    return result.data


@router.post("/")
async def create_story(body: StoryCreate, current_user: dict = Depends(get_current_user)):
    """Create a new story/task."""
    supabase = get_supabase_admin()

    def build_row(display_id: str) -> dict:
        return {
            "epic_id": body.epic_id,
            "title": body.title,
            "description": body.description,
            "type": body.type,
            "status": body.status,
            "priority": body.priority,
            "assignee_id": body.assignee_id,
            "reporter_id": current_user["id"],
            "display_id": display_id,
            "story_points": body.story_points,
            "start_date": body.start_date,
            "due_date": body.due_date,
        }

    result = create_with_display_id(supabase, "stories", "1CH", build_row)

    # Notify assignee on creation
    if body.assignee_id and body.assignee_id != current_user["id"]:
        display_id = result.get("display_id", "")
        supabase.table("notifications").insert({
            "user_id": body.assignee_id,
            "message": f"You were assigned to {display_id}: {body.title}",
            "link": f"/stories/{result.get('display_id', '')}",
            "read": False,
        }).execute()

    # Activity log with user attribution
    if result.get("id"):
        supabase.table("activity_log").insert({
            "parent_id": result["id"],
            "parent_type": "story",
            "user_id": current_user["id"],
            "action": "created",
            "new_value": body.title,
        }).execute()

    return result


@router.patch("/{story_id}")
async def update_story(story_id: str, body: StoryUpdate, current_user: dict = Depends(get_current_user)):
    """Update a story. Creates a notification if assignee changes."""
    supabase = get_supabase_admin()
    updates = body.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Check if assignee is changing — need old value for notification
    new_assignee = updates.get("assignee_id")
    old_story = supabase.table("stories").select("*").eq("id", story_id).single().execute()

    result = supabase.table("stories").update(updates).eq("id", story_id).execute()
    updated = result.data[0] if result.data else {}

    # Create notification if assignee changed to someone else
    if new_assignee and old_story and old_story.data:
        old_assignee = old_story.data.get("assignee_id")
        if new_assignee != old_assignee and new_assignee != current_user["id"]:
            display_id = old_story.data.get("display_id") or ""
            title = old_story.data.get("title") or ""
            supabase.table("notifications").insert({
                "user_id": new_assignee,
                "message": f"You were assigned to {display_id}: {title}",
                "link": f"/stories/{display_id}",
                "read": False,
            }).execute()

    # Write activity log entries with proper user attribution
    if old_story and old_story.data:
        for field, new_val in updates.items():
            if field == "sprint_id":
                continue  # Sprint moves are too noisy
            old_val = old_story.data.get(field)
            if str(new_val) != str(old_val):
                supabase.table("activity_log").insert({
                    "parent_id": story_id,
                    "parent_type": "story",
                    "user_id": current_user["id"],
                    "action": "updated",
                    "field_name": field,
                    "old_value": str(old_val) if old_val else None,
                    "new_value": str(new_val) if new_val else None,
                }).execute()

    return updated


@router.delete("/{story_id}")
async def delete_story(story_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a story (reporter or admin only)."""
    supabase = get_supabase_admin()

    story = supabase.table("stories").select("reporter_id").eq("id", story_id).single().execute()
    if not story.data:
        raise HTTPException(status_code=404, detail="Story not found")

    if story.data.get("reporter_id") != current_user["id"]:
        profile = supabase.table("profiles").select("role").eq("id", current_user["id"]).single().execute()
        if not profile.data or profile.data.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")

    supabase.table("stories").delete().eq("id", story_id).execute()
    return {"message": "Story deleted"}
