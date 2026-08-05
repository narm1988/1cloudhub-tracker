"""
FastAPI application entry point.
Deployed as a Vercel serverless function.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import auth, epics, stories, people, comments, attachments

app = FastAPI(
    title="1CloudHub Tracker API",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

# CORS for local dev and Vercel deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(epics.router, prefix="/api/epics", tags=["Epics"])
app.include_router(stories.router, prefix="/api/stories", tags=["Stories"])
app.include_router(people.router, prefix="/api/people", tags=["People"])
app.include_router(comments.router, prefix="/api/comments", tags=["Comments"])
app.include_router(attachments.router, prefix="/api/attachments", tags=["Attachments"])


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "1CloudHub Tracker"}


@app.get("/api/debug/supabase")
def debug_supabase():
    """Checks whether the Supabase connection works. Does NOT expose keys.
    Returns which env vars are set (length only) and whether a test query succeeds."""
    from api.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
    from api.deps import get_supabase_admin

    info = {
        "SUPABASE_URL_set": bool(SUPABASE_URL),
        "SUPABASE_URL_value": SUPABASE_URL[:30] + "..." if len(SUPABASE_URL) > 30 else SUPABASE_URL,
        "SERVICE_ROLE_KEY_length": len(SUPABASE_SERVICE_ROLE_KEY),
        "SERVICE_ROLE_KEY_prefix": SUPABASE_SERVICE_ROLE_KEY[:10] + "..." if SUPABASE_SERVICE_ROLE_KEY else "(empty)",
        "ANON_KEY_length": len(SUPABASE_ANON_KEY),
    }

    try:
        client = get_supabase_admin()
        result = client.table("profiles").select("id").limit(1).execute()
        info["db_connection"] = "OK"
        info["profiles_count"] = len(result.data)
    except Exception as e:
        info["db_connection"] = "FAILED"
        info["db_error"] = str(e)

    return info
