from uuid import UUID

from app.repositories.interfaces import FlossingRepository
from app.repositories.records import FlossingLogRecord
from app.services.gamification_service import GamificationService


class FlossingService:
    def __init__(
        self, repository: FlossingRepository, gamification_service: GamificationService
    ) -> None:
        self._repository = repository
        self._gamification_service = gamification_service

    def log_flossing(self, user_id: UUID, notes: str | None) -> FlossingLogRecord:
        log = self._repository.create(user_id, notes)
        self._gamification_service.evaluate_and_unlock(user_id)
        return log

    def list_logs(self, user_id: UUID, limit: int, offset: int) -> list[FlossingLogRecord]:
        return self._repository.list_by_user(user_id, limit, offset)
