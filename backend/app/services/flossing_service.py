from uuid import UUID

from app.repositories.interfaces import FlossingRepository
from app.repositories.records import FlossingLogRecord
from app.services.interfaces import PostMutationAchievementEvaluator


class FlossingService:
    def __init__(
        self,
        repository: FlossingRepository,
        gamification_service: PostMutationAchievementEvaluator,
    ) -> None:
        self._repository = repository
        self._gamification_service = gamification_service

    def log_flossing(
        self, user_id: UUID, notes: str | None, idempotency_key: str | None = None
    ) -> FlossingLogRecord:
        log = self._repository.create(user_id, notes, idempotency_key)
        self._gamification_service.evaluate_after_mutation(user_id)
        return log

    def list_logs(self, user_id: UUID, limit: int, offset: int) -> list[FlossingLogRecord]:
        return self._repository.list_by_user(user_id, limit, offset)
