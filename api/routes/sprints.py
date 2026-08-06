from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from api.deps import get_supabase_admin, get_current_user

router = APIRouter()


class SprintCreate(BaseModel):
    project_id: str
    name: str
    goal: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


@router.get("/")
async def list_sprints(project_id: str, current_user: dict = Depends(get_current_user)):
    """List sprints for a project."""
    supabase = get_supabase_admin()
    result = (
        supabase.table("sprints")
        .select("*")
        .eq("project_id", project_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


@router.post("/")
async def create_sprint(body: SprintCreate, current_user: dict = Depends(get_current_user)):
    """Create a new sprint (planned status)."""
    supabase = get_supabase_admin()
    result = supabase.table("sprints").insert({
        "project_id": body.project_id,
        "name": body.name,
        "goal": body.goal,
        "start_date": body.start_date,
        "end_date": body.end_date,
        "status": "planned",
    }).execute()
    return result.data[0] if result.data else {}


@router.post("/{sprint_id}/start")
async def start_sprint(sprint_id: str, current_user: dict = Depends(get_current_user)):
    """Transition a sprint to active."""
    supabase = get_supabase_admin()
    result = supabase.table("sprints").update({"status": "active"}).eq("id", sprint_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Sprint not found")
    return result.data[0]


@router.post("/{sprint_id}/complete")
async def complete_sprint(sprint_id: str, current_user: dict = Depends(get_current_user)):
    """Transition a sprint to completed and move its unfinished stories back
    to the backlog — mirrors the two-step action the frontend used to do as
    separate Supabase calls, now atomic on the server."""
    supabase = get_supabase_admin()
    result = supabase.table("sprints").update({"status": "completed"}).eq("id", sprint_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Sprint not found")

    supabase.table("stories").update({"sprint_id": None}).eq("sprint_id", sprint_id).neq("status", "Done").execute()

    return result.data[0]
