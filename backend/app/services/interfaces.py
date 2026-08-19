from dataclasses import dataclass
from typing import Protocol

from app.domain.enums import PushDeliveryOutcome
from app.repositories.records import ClaimedNotificationDeliveryRecord
from app.schemas.health import HealthStatus


class HealthService(Protocol):
    """Contrato para a regra de negócio de verificação de saúde da aplicação."""

    def check(self) -> HealthStatus: ...


@dataclass(frozen=True)
class PushSendResult:
    outcome: PushDeliveryOutcome
    error_code: str | None = None


class PushGateway(Protocol):
    def send(self, delivery: ClaimedNotificationDeliveryRecord) -> PushSendResult: ...
