"""
FastAPI application entry point.
Deployed as a Vercel serverless function.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import (
    auth, epics, stories, issues, people, comments, attachments, projects,
    sprints, labels, issue_links, notifications, search, activity_log, notify,
)

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
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(epics.router, prefix="/api/epics", tags=["Epics"])
app.include_router(stories.router, prefix="/api/stories", tags=["Stories"])
app.include_router(issues.router, prefix="/api/issues", tags=["Issues"])
app.include_router(people.router, prefix="/api/people", tags=["People"])
app.include_router(comments.router, prefix="/api/comments", tags=["Comments"])
app.include_router(attachments.router, prefix="/api/attachments", tags=["Attachments"])
app.include_router(sprints.router, prefix="/api/sprints", tags=["Sprints"])
app.include_router(labels.router, prefix="/api/labels", tags=["Labels"])
app.include_router(issue_links.router, prefix="/api/issue-links", tags=["Issue Links"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(search.router, prefix="/api/search", tags=["Search"])
app.include_router(activity_log.router, prefix="/api/activity-log", tags=["Activity Log"])
app.include_router(notify.router, prefix="/api/notify", tags=["Notify"])


@app.get("/api/health")
def health_check():
    from api.config import FRONTEND_URL, ENTRA_REDIRECT_URI
    return {
        "status": "ok",
        "service": "1CloudHub Tracker",
        "FRONTEND_URL": FRONTEND_URL,
        "ENTRA_REDIRECT_URI": ENTRA_REDIRECT_URI,
    }


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


@app.get("/api/debug/me-test")
def debug_me_test():
    """Simulates the /auth/me flow: mints a token for a real profile, then verifies it."""
    from api.deps import get_supabase_admin
    from api.lib.jwt import create_access_token, verify_access_token

    supabase = get_supabase_admin()
    # Grab the first profile in the DB
    result = supabase.table("profiles").select("*").limit(1).execute()
    if not result.data:
        return {"error": "No profiles in DB"}

    profile = result.data[0]
    info = {
        "profile_id": profile["id"],
        "profile_email": profile["email"],
        "profile_role": profile.get("role"),
    }

    try:
        token = create_access_token(profile["id"], profile["email"], profile.get("role", "member"))
        info["token_created"] = True
    except Exception as e:
        info["token_created"] = False
        info["create_error"] = str(e)
        return info

    try:
        claims = verify_access_token(token)
        info["token_verified"] = True
        info["claims"] = claims
    except Exception as e:
        info["token_verified"] = False
        info["verify_error"] = str(e)
        return info

    # Now simulate the /me lookup
    try:
        profile_lookup = supabase.table("profiles").select("*").eq("id", claims["sub"]).single().execute()
        info["me_lookup"] = "OK"
        info["me_data"] = {
            "id": profile_lookup.data["id"],
            "email": profile_lookup.data["email"],
            "full_name": profile_lookup.data["full_name"],
        }
    except Exception as e:
        info["me_lookup"] = "FAILED"
        info["me_error"] = str(e)

    return info
