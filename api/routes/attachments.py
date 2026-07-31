from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from api.deps import get_supabase_admin, get_current_user
import uuid

router = APIRouter()

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt", ".zip"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.get("/")
async def list_attachments(story_id: str, current_user: dict = Depends(get_current_user)):
    """List all attachments for a story."""
    supabase = get_supabase_admin()
    result = supabase.table("attachments").select("*").eq("story_id", story_id).order("created_at", desc=True).execute()
    return result.data or []


@router.post("/upload")
async def upload_attachment(
    story_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Upload a file attachment to a story."""
    supabase = get_supabase_admin()

    # Validate file extension
    file_ext = "." + file.filename.split(".")[-1].lower() if file.filename and "." in file.filename else ""
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type not allowed: {file_ext}")

    # Read file content
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    # Upload to Supabase Storage
    file_id = str(uuid.uuid4())
    storage_path = f"attachments/{story_id}/{file_id}{file_ext}"

    storage_result = supabase.storage.from_("tracker-files").upload(
        storage_path,
        content,
        {"content-type": file.content_type or "application/octet-stream"},
    )

    # Get public URL
    file_url = supabase.storage.from_("tracker-files").get_public_url(storage_path)

    # Store metadata in DB
    result = supabase.table("attachments").insert({
        "story_id": story_id,
        "file_name": file.filename,
        "file_url": file_url,
        "file_size": len(content),
        "uploaded_by": current_user["id"],
    }).execute()

    return result.data[0] if result.data else {}


@router.delete("/{attachment_id}")
async def delete_attachment(attachment_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an attachment."""
    supabase = get_supabase_admin()

    attachment = supabase.table("attachments").select("*").eq("id", attachment_id).single().execute()
    if not attachment.data:
        raise HTTPException(status_code=404, detail="Attachment not found")

    # Delete from storage (best effort)
    try:
        file_url = attachment.data["file_url"]
        storage_path = file_url.split("/tracker-files/")[-1] if "/tracker-files/" in file_url else ""
        if storage_path:
            supabase.storage.from_("tracker-files").remove([storage_path])
    except Exception:
        pass

    # Delete DB record
    supabase.table("attachments").delete().eq("id", attachment_id).execute()
    return {"message": "Attachment deleted"}
