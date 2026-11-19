from fastapi import APIRouter
from app.api.endpoints import projects, tasks, prerequisites, exports

api_router = APIRouter()

api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(prerequisites.router, prefix="/prerequisites", tags=["prerequisites"])
api_router.include_router(exports.router, prefix="/projects", tags=["exports"])
