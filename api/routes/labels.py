from typing import Literal, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from api.deps import get_supabase_admin, get_current_user

router = APIRouter()

ParentType = Literal["story", "issue"]

_JUNCTION = {
    "story": {"table": "story_labels", "column": "story_id", "fk": "story_labels_label_id_fkey"},
    "issue": {"table": "issue_labels", "column": "issue_id", "fk": "issue_labels_label_id_fkey"},
}


class LabelCreate(BaseModel):
    name: str
    color: str
    project_id: Optional[str] = None


class LabelAttach(BaseModel):
    parent_type: ParentType
    parent_id: str
    label_id: str


@router.get("/")
async def list_labels(current_user: dict = Depends(get_current_user)):
    """List every label in the workspace (labels aren't project-scoped in
    the UI today — mirrors the frontend's existing unfiltered query)."""
    supabase = get_supabase_admin()
    result = supabase.table("labels").select("*").order("name").execute()
    return result.data or []


@router.get("/attached")
async def list_attached_labels(
    parent_type: ParentType,
    parent_id: str,
    current_user: dict = Depends(get_current_user),
):
    """List labels attached to a specific story or issue."""
    supabase = get_supabase_admin()
    junction = _JUNCTION[parent_type]
    result = (
        supabase.table(junction["table"])
        .select(f"label_id, labels:labels!{junction['fk']}(id, name, color)")
        .eq(junction["column"], parent_id)
        .execute()
    )
    return [row["labels"] for row in (result.data or []) if row.get("labels")]


@router.post("/")
async def create_label(body: LabelCreate, current_user: dict = Depends(get_current_user)):
    """Create a new label."""
    supabase = get_supabase_admin()
    result = supabase.table("labels").insert({
        "name": body.name,
        "color": body.color,
        "project_id": body.project_id,
    }).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create label")
    return result.data[0]


@router.post("/attach")
async def attach_label(body: LabelAttach, current_user: dict = Depends(get_current_user)):
    """Attach an existing label to a story or issue."""
    supabase = get_supabase_admin()
    junction = _JUNCTION[body.parent_type]
    supabase.table(junction["table"]).insert({
        junction["column"]: body.parent_id,
        "label_id": body.label_id,
    }).execute()
    return {"message": "Label attached"}


@router.delete("/attach")
async def detach_label(
    parent_type: ParentType,
    parent_id: str,
    label_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Detach a label from a story or issue."""
    supabase = get_supabase_admin()
    junction = _JUNCTION[parent_type]
    supabase.table(junction["table"]).delete().eq(junction["column"], parent_id).eq("label_id", label_id).execute()
    return {"message": "Label detached"}
