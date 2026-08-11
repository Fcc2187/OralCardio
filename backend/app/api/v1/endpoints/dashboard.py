from fastapi import APIRouter, Depends

from app.api.deps import get_dashboard_service
from app.core.security import CurrentUser, get_current_user
from app.schemas.dashboard import DashboardOutput
from app.services.dashboard_service import DashboardService

router = APIRouter()


@router.get("/dashboard", response_model=DashboardOutput)
def get_dashboard(
    current_user: CurrentUser = Depends(get_current_user),
    service: DashboardService = Depends(get_dashboard_service),
) -> DashboardOutput:
    return DashboardOutput.from_summary(service.get_summary(current_user.id))
