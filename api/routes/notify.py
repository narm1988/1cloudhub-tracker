from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from api.config import FRONTEND_URL
from api.deps import get_supabase_admin, get_current_user
from api.lib.email import send_assignment_email

router = APIRouter()


class AssignmentNotification(BaseModel):
    assignee_id: str
    item_type: str
    display_id: str
    title: str
    item_path: str
    breadcrumb: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[str] = None


@router.post("/assignment")
async def notify_assignment(body: AssignmentNotification, current_user: dict = Depends(get_current_user)):
    """Emails the assignee that they've been assigned an item. The in-app
    notification row is already created by an existing Postgres trigger on
    the stories/issues UPDATE — this only sends the email half, replacing
    the send-assignment-email Supabase Edge Function.

    Note: item_url is built from this backend's own FRONTEND_URL, not a
    client-supplied value — the old edge function trusted a client-passed
    appUrl, which is an unnecessary bit of trust to extend."""
    if body.assignee_id == current_user["id"]:
        return {"success": True, "skipped": "self-assignment"}

    supabase = get_supabase_admin()
    assignee = supabase.table("profiles").select("email, full_name").eq("id", body.assignee_id).single().execute()
    if not assignee.data or not assignee.data.get("email"):
        raise HTTPException(status_code=404, detail="Assignee not found")

    assigner = supabase.table("profiles").select("full_name").eq("id", current_user["id"]).single().execute()

    send_assignment_email(
        to_email=assignee.data["email"],
        assignee_first_name=(assignee.data.get("full_name") or "there").split(" ")[0],
        assigned_by_name=(assigner.data or {}).get("full_name") or "Someone",
        item_type=body.item_type,
        display_id=body.display_id,
        title=body.title,
        item_url=f"{FRONTEND_URL}{body.item_path}",
        breadcrumb=body.breadcrumb,
        priority=body.priority,
        due_date=body.due_date,
    )

    return {"success": True}
