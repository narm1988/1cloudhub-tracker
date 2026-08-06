from typing import List
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from api.deps import get_supabase_admin, get_current_user

router = APIRouter()


class MarkAllReadRequest(BaseModel):
    ids: List[str]


@router.get("/")
async def list_notifications(current_user: dict = Depends(get_current_user)):
    """List the current user's most recent notifications. Polled from the
    frontend on an interval — this app is deployed as Vercel serverless
    functions, which can't hold a realtime websocket/SSE connection open,
    so polling replaces the Supabase Realtime subscription it used to use."""
    supabase = get_supabase_admin()
    result = (
        supabase.table("notifications")
        .select("*")
        .eq("user_id", current_user["id"])
        .order("created_at", desc=True)
        .limit(30)
        .execute()
    )
    return result.data or []


@router.get("/unread-count")
async def unread_count(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_admin()
    result = (
        supabase.table("notifications")
        .select("id", count="exact")
        .eq("user_id", current_user["id"])
        .eq("read", False)
        .execute()
    )
    return {"count": result.count or 0}


@router.patch("/{notification_id}/read")
async def mark_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_admin()
    supabase.table("notifications").update({"read": True}).eq("id", notification_id).eq(
        "user_id", current_user["id"]
    ).execute()
    return {"message": "Marked read"}


@router.post("/mark-all-read")
async def mark_all_read(body: MarkAllReadRequest, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_admin()
    supabase.table("notifications").update({"read": True}).in_("id", body.ids).eq(
        "user_id", current_user["id"]
    ).execute()
    return {"message": "Marked all read"}
