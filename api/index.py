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
