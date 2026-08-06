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


@router.get("/full/{issue_id}")
async def get_issue_full(issue_id: str, current_user: dict = Depends(get_current_user)):
    """Get issue + comments + attachments + labels + members in one call."""
    supabase = get_supabase_admin()

    # Resolve display_id to UUID
    if "-" in issue_id and len(issue_id) < 20:
        res = supabase.table("issues").select("id").eq("display_id", issue_id.upper()).maybe_single().execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Issue not found")
        uuid = res.data["id"]
    else:
        uuid = issue_id

    # Parallel queries
    issue_res = supabase.table("issues").select(_SELECT).eq("id", uuid).maybe_single().execute()
    if not issue_res.data:
        raise HTTPException(status_code=404, detail="Issue not found")

    comments_res = supabase.table("comments").select(
        "*, author:profiles!comments_author_id_fkey(id, full_name, email)"
    ).eq("parent_id", uuid).eq("parent_type", "issue").order("created_at", desc=True).execute()

    attachments_res = supabase.table("attachments").select("*").eq("parent_id", uuid).eq("parent_type", "issue").order("created_at", desc=True).execute()

    # Labels via junction table
    labels_res = supabase.table("issue_labels").select(
        "label_id, labels:labels!issue_labels_label_id_fkey(id, name, color)"
    ).eq("issue_id", uuid).execute()

    members_res = supabase.table("profiles").select("id, full_name, email, role").order("full_name").execute()

    # Parent story (if exists)
    parent_story = None
    if issue_res.data.get("story_id"):
        ps_res = supabase.table("stories").select("id, display_id, title").eq("id", issue_res.data["story_id"]).maybe_single().execute()
        parent_story = ps_res.data

    return {
        "issue": issue_res.data,
        "comments": comments_res.data or [],
        "attachments": attachments_res.data or [],
        "labels": [row["labels"] for row in (labels_res.data or []) if row.get("labels")],
        "members": members_res.data or [],
        "parent_story": parent_story,
    }


@router.get("/{issue_id}")
async def get_issue(issue_id: str, current_user: dict = Depends(get_current_user)):
    """Get a single issue by UUID or display_id (e.g. BUG-106, TSK-101)."""
    supabase = get_supabase_admin()

    if "-" in issue_id and len(issue_id) < 20:
        result = supabase.table("issues").select(_SELECT).eq("display_id", issue_id.upper()).maybe_single().execute()
    else:
        result = supabase.table("issues").select(_SELECT).eq("id", issue_id).maybe_single().execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Issue not found")
    return result.data


@router.post("/")
async def create_issue(body: IssueCreate, current_user: dict = Depends(get_current_user)):
    """Create a new issue (Task/Bug/Sub-task). Notifies assignee if set."""
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

    result = create_with_display_id(supabase, "issues", prefix, build_row)

    # Create notification for assignee (if assigned to someone else)
    if body.assignee_id and body.assignee_id != current_user["id"]:
        display_id = result.get("display_id", "")
        supabase.table("notifications").insert({
            "user_id": body.assignee_id,
            "message": f"You were assigned to {display_id}: {body.title}",
            "link": f"/issues/{result.get('display_id', '')}",
            "read": False,
        }).execute()

    # Write activity log entry with proper user attribution
    if result.get("id"):
        supabase.table("activity_log").insert({
            "parent_id": result["id"],
            "parent_type": "issue",
            "user_id": current_user["id"],
            "action": "created",
            "new_value": body.title,
        }).execute()

    return result


@router.patch("/{issue_id}")
async def update_issue(issue_id: str, body: IssueUpdate, current_user: dict = Depends(get_current_user)):
    """Update an issue. Creates a notification if assignee changes."""
    supabase = get_supabase_admin()
    updates = body.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Check if assignee is changing
    new_assignee = updates.get("assignee_id")
    old_issue = None
    if new_assignee is not None:
        old_issue = supabase.table("issues").select("assignee_id, display_id, title").eq("id", issue_id).single().execute()

    result = supabase.table("issues").update(updates).eq("id", issue_id).execute()
    updated = result.data[0] if result.data else {}

    # Create notification if assignee changed to someone else
    if new_assignee and old_issue and old_issue.data:
        old_assignee = old_issue.data.get("assignee_id")
        if new_assignee != old_assignee and new_assignee != current_user["id"]:
            display_id = old_issue.data.get("display_id") or ""
            title = old_issue.data.get("title") or ""
            supabase.table("notifications").insert({
                "user_id": new_assignee,
                "message": f"You were assigned to {display_id}: {title}",
                "link": f"/issues/{display_id}",
                "read": False,
            }).execute()

    # Write activity log entries with proper user attribution
    if old_issue and old_issue.data:
        for field, new_val in updates.items():
            old_val = old_issue.data.get(field)
            if str(new_val) != str(old_val):
                supabase.table("activity_log").insert({
                    "parent_id": issue_id,
                    "parent_type": "issue",
                    "user_id": current_user["id"],
                    "action": "updated",
                    "field_name": field,
                    "old_value": str(old_val) if old_val else None,
                    "new_value": str(new_val) if new_val else None,
                }).execute()

    return updated


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
