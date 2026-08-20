from fastapi import APIRouter, Depends

from app.api.deps import require_completed_health_profile
from app.api.v1.endpoints import (
    appointments,
    brushing,
    dashboard,
    education,
    flossing,
    gamification,
    health,
    health_profile,
    notification_revocations,
    notifications,
    users,
)

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router, tags=["health"])
api_router.include_router(notification_revocations.router, tags=["notifications"])
api_router.include_router(users.router, tags=["users"])
api_router.include_router(health_profile.router, tags=["health-profile"])
api_router.include_router(
    brushing.router, tags=["brushing"], dependencies=[Depends(require_completed_health_profile)]
)
api_router.include_router(
    flossing.router, tags=["flossing"], dependencies=[Depends(require_completed_health_profile)]
)
api_router.include_router(
    education.router, tags=["education"], dependencies=[Depends(require_completed_health_profile)]
)
api_router.include_router(
    gamification.router,
    tags=["gamification"],
    dependencies=[Depends(require_completed_health_profile)],
)
api_router.include_router(dashboard.router, tags=["dashboard"])
api_router.include_router(
    appointments.router,
    tags=["appointments"],
    dependencies=[Depends(require_completed_health_profile)],
)
api_router.include_router(
    notifications.router,
    tags=["notifications"],
    dependencies=[Depends(require_completed_health_profile)],
)
