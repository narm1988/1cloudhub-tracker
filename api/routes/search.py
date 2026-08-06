from typing import Optional
from fastapi import APIRouter, Depends
from api.deps import get_supabase_admin, get_current_user

router = APIRouter()

_STORY_SELECT = "id, display_id, title, status, priority, due_date, updated_at, assignee:profiles!stories_assignee_id_fkey(full_name)"
_ISSUE_SELECT = "id, type, display_id, title, status, priority, due_date, updated_at, assignee:profiles!issues_assignee_id_fkey(full_name)"


@router.get("/")
async def search(
    q: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assignee_id: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    current_user: dict = Depends(get_current_user),
):
    """Searches stories + issues by title/display_id/description, with
    optional status/priority/assignee filters. Server-side port of what
    SearchPage.tsx used to do with two direct Supabase queries + a client
    merge — same approach, just run here instead."""
    supabase = get_supabase_admin()

    story_query = supabase.table("stories").select(_STORY_SELECT).order("updated_at", desc=True).limit(100)
    issue_query = supabase.table("issues").select(_ISSUE_SELECT).order("updated_at", desc=True).limit(100)

    if q and q.strip():
        term = q.strip()
        story_query = story_query.or_(f"title.ilike.%{term}%,display_id.ilike.%{term}%,description.ilike.%{term}%")
        issue_query = issue_query.or_(f"title.ilike.%{term}%,display_id.ilike.%{term}%,description.ilike.%{term}%")
    if status:
        story_query = story_query.eq("status", status)
        issue_query = issue_query.eq("status", status)
    if priority:
        story_query = story_query.eq("priority", priority)
        issue_query = issue_query.eq("priority", priority)
    if assignee_id:
        story_query = story_query.eq("assignee_id", assignee_id)
        issue_query = issue_query.eq("assignee_id", assignee_id)

    stories = story_query.execute().data or []
    issues = issue_query.execute().data or []

    combined = [
        {**s, "kind": "story", "type": "Story"} for s in stories
    ] + [
        {**i, "kind": "issue"} for i in issues
    ]

    total = len(combined)
    start = (page - 1) * page_size
    return {"data": combined[start:start + page_size], "total": total}
