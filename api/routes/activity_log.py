from typing import Literal
from fastapi import APIRouter, Depends
from api.deps import get_supabase_admin, get_current_user

router = APIRouter()

ParentType = Literal["story", "issue", "epic"]


@router.get("/")
async def list_activity(parent_id: str, parent_type: ParentType, current_user: dict = Depends(get_current_user)):
    """Read-only audit trail for a story/issue/epic. Rows are written by
    existing Postgres triggers on insert/update — this endpoint only reads."""
    supabase = get_supabase_admin()
    result = (
        supabase.table("activity_log")
        .select("*, user:profiles(id, full_name, avatar_url)")
        .eq("parent_id", parent_id)
        .eq("parent_type", parent_type)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []
