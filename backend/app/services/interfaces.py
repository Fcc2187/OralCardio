from typing import Protocol

from app.schemas.health import HealthStatus


class HealthService(Protocol):
    """Contrato para a regra de negócio de verificação de saúde da aplicação."""

    def check(self) -> HealthStatus: ...