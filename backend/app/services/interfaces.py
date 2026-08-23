from typing import Protocol
from uuid import UUID

from app.application.contracts import PushSendResult
from app.repositories.records import ClaimedNotificationDeliveryRecord


class PushGateway(Protocol):
    def send(self, delivery: ClaimedNotificationDeliveryRecord) -> PushSendResult: ...


class AchievementEvaluationService(Protocol):
    def evaluate_and_unlock(self, user_id: UUID) -> None: ...


class PostMutationAchievementEvaluator(Protocol):
    """Porta usada por casos de uso que apenas sinalizam uma possível conquista."""

    def evaluate_after_mutation(self, user_id: UUID) -> None: ...
