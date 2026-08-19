from fastapi import APIRouter

from app.api.v1.endpoints import (
    appointments,
    brushing,
    dashboard,
    education,
    flossing,
    gamification,
    health,
    health_profile,
    notifications,
    users,
)

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router, tags=["health"])
api_router.include_router(users.router, tags=["users"])
api_router.include_router(health_profile.router, tags=["health-profile"])
api_router.include_router(brushing.router, tags=["brushing"])
api_router.include_router(flossing.router, tags=["flossing"])
api_router.include_router(education.router, tags=["education"])
api_router.include_router(gamification.router, tags=["gamification"])
api_router.include_router(dashboard.router, tags=["dashboard"])
api_router.include_router(appointments.router, tags=["appointments"])
api_router.include_router(notifications.router, tags=["notifications"])
