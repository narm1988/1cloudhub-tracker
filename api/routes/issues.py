from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from api.deps import get_supabase_admin, get_current_user
from api.lib.display_id import create_with_display_id

router = APIRouter()

_TYPE_PREFIX = {"Bug": "BUG", "Sub-task": "SUB", "Task": "TSK"}


class IssueCreate(BaseModel):
    story_id: str
    title: str
    description: Optional[str] = None
    type: str = "Task"
    status: str = "Created"
    priority: str = "Medium"
    assignee_id: Optional[str] = None
    story_points: Optional[int] = None
    start_date: Optional[str] = None
    due_date: Optional[str] = None


class IssueUpdate(BaseModel):
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


_SELECT = (
    "*, assignee:profiles!issues_assignee_id_fkey(id, full_name, email), "
    "reporter:profiles!issues_reporter_id_fkey(id, full_name, email)"
)


@router.get("/")
async def list_issues(story_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """List issues, optionally filtered by story."""
    supabase = get_supabase_admin()
    query = supabase.table("issues").select(_SELECT)
    if story_id:
        query = query.eq("story_id", story_id)
    result = query.order("created_at", desc=True).execute()
    return result.data or []


@router.get("/{issue_id}")
async def get_issue(issue_id: str, current_user: dict = Depends(get_current_user)):
    """Get a single issue."""
    supabase = get_supabase_admin()
    result = supabase.table("issues").select(_SELECT).eq("id", issue_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Issue not found")
    return result.data


@router.post("/")
async def create_issue(body: IssueCreate, current_user: dict = Depends(get_current_user)):
    """Create a new issue (Task/Bug/Sub-task)."""
    supabase = get_supabase_admin()
    prefix = _TYPE_PREFIX.get(body.type, "TSK")

    def build_row(display_id: str) -> dict:
        return {
            "story_id": body.story_id,
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

    return create_with_display_id(supabase, "issues", prefix, build_row)


@router.patch("/{issue_id}")
async def update_issue(issue_id: str, body: IssueUpdate, current_user: dict = Depends(get_current_user)):
    """Update an issue."""
    supabase = get_supabase_admin()
    updates = body.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = supabase.table("issues").update(updates).eq("id", issue_id).execute()
    return result.data[0] if result.data else {}


@router.delete("/{issue_id}")
async def delete_issue(issue_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an issue (reporter or admin only)."""
    supabase = get_supabase_admin()

    issue = supabase.table("issues").select("reporter_id").eq("id", issue_id).single().execute()
    if not issue.data:
        raise HTTPException(status_code=404, detail="Issue not found")

    if issue.data.get("reporter_id") != current_user["id"]:
        profile = supabase.table("profiles").select("role").eq("id", current_user["id"]).single().execute()
        if not profile.data or profile.data.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")

    supabase.table("issues").delete().eq("id", issue_id).execute()
    return {"message": "Issue deleted"}
