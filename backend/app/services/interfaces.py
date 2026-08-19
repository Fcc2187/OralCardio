from typing import Protocol
from uuid import UUID

from app.application.contracts import HealthStatus, PushSendResult
from app.repositories.records import ClaimedNotificationDeliveryRecord


class HealthService(Protocol):
    """Contrato para a regra de negócio de verificação de saúde da aplicação."""

    def check(self) -> HealthStatus: ...


class PushGateway(Protocol):
    def send(self, delivery: ClaimedNotificationDeliveryRecord) -> PushSendResult: ...


class AchievementEvaluationService(Protocol):
    def evaluate_and_unlock(self, user_id: UUID) -> None: ...


class PostMutationAchievementEvaluator(Protocol):
    """Porta usada por casos de uso que apenas sinalizam uma possível conquista."""

    def evaluate_after_mutation(self, user_id: UUID) -> None: ...
