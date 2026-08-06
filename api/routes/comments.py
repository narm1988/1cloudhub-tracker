from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Literal
from api.deps import get_supabase_admin, get_current_user

router = APIRouter()

ParentType = Literal["story", "issue"]


class CommentCreate(BaseModel):
    parent_id: str
    parent_type: ParentType
    content: str


@router.get("/")
async def list_comments(parent_id: str, parent_type: ParentType, current_user: dict = Depends(get_current_user)):
    """List all comments for a story or issue."""
    supabase = get_supabase_admin()
    result = (
        supabase.table("comments")
        .select("*, author:profiles!comments_author_id_fkey(id, full_name, email, avatar_url)")
        .eq("parent_id", parent_id)
        .eq("parent_type", parent_type)
        .order("created_at")
        .execute()
    )
    return result.data or []


@router.post("/")
async def create_comment(body: CommentCreate, current_user: dict = Depends(get_current_user)):
    """Add a comment to a story or issue."""
    supabase = get_supabase_admin()
    result = supabase.table("comments").insert({
        "parent_id": body.parent_id,
        "parent_type": body.parent_type,
        "author_id": current_user["id"],
        "content": body.content,
    }).execute()
    return result.data[0] if result.data else {}


@router.delete("/{comment_id}")
async def delete_comment(comment_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a comment (author or admin only)."""
    supabase = get_supabase_admin()

    comment = supabase.table("comments").select("author_id").eq("id", comment_id).single().execute()
    if not comment.data:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.data["author_id"] != current_user["id"]:
        profile = supabase.table("profiles").select("role").eq("id", current_user["id"]).single().execute()
        if not profile.data or profile.data.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")

    supabase.table("comments").delete().eq("id", comment_id).execute()
    return {"message": "Comment deleted"}
