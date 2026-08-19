from fastapi import APIRouter, Depends, Response, status

from app.core.supabase_client import get_supabase_client
from app.repositories.health_repository import SupabaseHealthRepository
from app.schemas.health import HealthStatusOutput
from app.services.health_service import DefaultHealthService

router = APIRouter()


def get_health_service() -> DefaultHealthService:
    repository = SupabaseHealthRepository(get_supabase_client())
    return DefaultHealthService(repository)


@router.get("/health", response_model=HealthStatusOutput)
def get_health(
    response: Response, service: DefaultHealthService = Depends(get_health_service)
) -> HealthStatusOutput:
    health = service.check()
    if not health.database:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return HealthStatusOutput.from_status(health)
