from datetime import UTC, datetime
from uuid import UUID

from app.core.exceptions import BusinessRuleViolationError, EntityNotFoundError
from app.domain.brushing import is_session_complete, validate_zone_transition
from app.domain.enums import BrushingZone
from app.repositories.interfaces import BrushingRepository
from app.repositories.records import BrushingSessionRecord
from app.services.interfaces import PostMutationAchievementEvaluator

_DEFAULT_TARGET_DURATION_SECONDS = 120


class BrushingService:
    def __init__(
        self,
        repository: BrushingRepository,
        gamification_service: PostMutationAchievementEvaluator,
    ) -> None:
        self._repository = repository
        self._gamification_service = gamification_service

    def start_session(
        self, user_id: UUID, idempotency_key: str | None = None
    ) -> BrushingSessionRecord:
        return self._repository.create(
            user_id, _DEFAULT_TARGET_DURATION_SECONDS, idempotency_key
        )

    def mark_zone_completed(
        self, session_id: UUID, user_id: UUID, zone: BrushingZone
    ) -> BrushingSessionRecord:
        session = self._get_owned_session(session_id, user_id)

        if session.is_completed:
            raise BusinessRuleViolationError("Sessão já concluída, não pode ser alterada")

        updated_zones = validate_zone_transition(set(session.zones_completed), zone)
        return self._repository.update_zones(session_id, user_id, sorted(updated_zones, key=str))

    def complete_session(
        self, session_id: UUID, user_id: UUID
    ) -> BrushingSessionRecord:
        session = self._get_owned_session(session_id, user_id)

        if session.is_completed:
            return session

        if not is_session_complete(set(session.zones_completed)):
            raise BusinessRuleViolationError(
                "Todas as 5 zonas da boca precisam ser concluídas antes de finalizar"
            )

        duration_seconds = self._calculate_duration_seconds(session)
        completed = self._repository.complete(session_id, user_id, duration_seconds)
        self._gamification_service.evaluate_after_mutation(user_id)
        return completed

    def list_sessions(
        self, user_id: UUID, limit: int, offset: int
    ) -> list[BrushingSessionRecord]:
        return self._repository.list_by_user(user_id, limit, offset)

    def _get_owned_session(self, session_id: UUID, user_id: UUID) -> BrushingSessionRecord:
        session = self._repository.get_by_id(session_id, user_id)
        if session is None:
            raise EntityNotFoundError("Sessão de escovação", str(session_id))
        return session

    @staticmethod
    def _calculate_duration_seconds(session: BrushingSessionRecord) -> int:
        now = datetime.now(UTC)
        elapsed = int((now - session.started_at).total_seconds())
        return max(0, min(elapsed, session.target_duration))
