from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from api.deps import get_current_user, get_supabase_admin

router = APIRouter()


class ProjectCreate(BaseModel):
    name: str
    key: str
    description: Optional[str] = None


@router.get("/")
async def list_projects(
    page: int = 1,
    page_size: int = 12,
    current_user: dict = Depends(get_current_user),
):
    supabase = get_supabase_admin()
    from_ = (page - 1) * page_size
    to = from_ + page_size - 1

    result = (
        supabase.table("projects")
        .select("*", count="exact")
        .order("created_at", desc=True)
        .range(from_, to)
        .execute()
    )
    return {"data": result.data or [], "total": result.count or 0}


@router.get("/{project_id}")
async def get_project(project_id: str, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase_admin()
    result = supabase.table("projects").select("*").eq("id", project_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Project not found")
    return result.data


@router.post("/")
async def create_project(body: ProjectCreate, current_user: dict = Depends(get_current_user)):
    """Admin-only, matching the create-project button's visibility in the UI."""
    supabase = get_supabase_admin()

    profile = supabase.table("profiles").select("role").eq("id", current_user["id"]).single().execute()
    if not profile.data or profile.data.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create projects")

    key = body.key.strip().upper()
    if not (2 <= len(key) <= 5):
        raise HTTPException(status_code=400, detail="Key must be 2-5 characters")

    try:
        result = supabase.table("projects").insert({
            "name": body.name,
            "key": key,
            "description": body.description,
            "created_by": current_user["id"],
        }).execute()
    except Exception as e:
        # postgrest raises on unique-constraint violations (duplicate key)
        # rather than returning them in the response — surface a clean 409
        # instead of a raw 500.
        if "duplicate key" in str(e).lower() or "already exists" in str(e).lower():
            raise HTTPException(status_code=409, detail=f'Project key "{key}" is already in use')
        raise HTTPException(status_code=400, detail="Failed to create project")

    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create project")
    return result.data[0]
