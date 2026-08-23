from fastapi import APIRouter, Depends, Response, status

from app.core.supabase_client import get_supabase_client
from app.repositories.health_repository import SupabaseHealthRepository
from app.repositories.interfaces import HealthRepository
from app.schemas.health import HealthStatusOutput

router = APIRouter()


def get_health_repository() -> HealthRepository:
    return SupabaseHealthRepository(get_supabase_client())


def _check_health(response: Response, repository: HealthRepository) -> HealthStatusOutput:
    database_is_healthy = repository.ping()
    if not database_is_healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return HealthStatusOutput(api=True, database=database_is_healthy)


@router.get("/health", response_model=HealthStatusOutput)
def get_health(
    response: Response,
    repository: HealthRepository = Depends(get_health_repository),
) -> HealthStatusOutput:
    return _check_health(response, repository)


@router.get("/health/live", response_model=HealthStatusOutput)
def get_liveness() -> HealthStatusOutput:
    """Sonda de processo: não depende de rede, banco ou Supabase."""
    return HealthStatusOutput(api=True, database=False)


@router.get("/health/ready", response_model=HealthStatusOutput)
def get_readiness(
    response: Response,
    repository: HealthRepository = Depends(get_health_repository),
) -> HealthStatusOutput:
    """Sonda de readiness: só fica saudável quando a dependência essencial responde."""
    return _check_health(response, repository)
