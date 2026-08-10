from app.repositories.interfaces import HealthRepository
from app.schemas.health import HealthStatus


class DefaultHealthService:
    """Serviço de health check, depende apenas da interface do repositório."""

    def __init__(self, repository: HealthRepository) -> None:
        self._repository = repository

    def check(self) -> HealthStatus:
        return HealthStatus(api=True, database=self._repository.ping())