from typing import Literal
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from api.deps import get_supabase_admin, get_current_user

router = APIRouter()

LinkParentType = Literal["story", "issue"]


class IssueLinkCreate(BaseModel):
    source_id: str
    source_type: LinkParentType
    target_id: str
    target_type: LinkParentType
    link_type: str


@router.get("/")
async def list_issue_links(item_id: str, current_user: dict = Depends(get_current_user)):
    """List links where the given id is either the source or the target."""
    supabase = get_supabase_admin()
    result = (
        supabase.table("issue_links")
        .select("*")
        .or_(f"source_id.eq.{item_id},target_id.eq.{item_id}")
        .execute()
    )
    return result.data or []


@router.post("/")
async def create_issue_link(body: IssueLinkCreate, current_user: dict = Depends(get_current_user)):
    """Create a link between two stories/issues (blocks, relates to, etc.)."""
    supabase = get_supabase_admin()
    result = supabase.table("issue_links").insert(body.model_dump()).execute()
    return result.data[0] if result.data else {}


@router.delete("/{link_id}")
async def delete_issue_link(link_id: str, current_user: dict = Depends(get_current_user)):
    """Remove a link."""
    supabase = get_supabase_admin()
    supabase.table("issue_links").delete().eq("id", link_id).execute()
    return {"message": "Link removed"}
