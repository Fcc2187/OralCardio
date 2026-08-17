from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from app.core.clock import BusinessClock
from app.core.exceptions import EntityNotFoundError
from app.domain.achievements import AchievementEvaluator
from app.repositories.interfaces import GamificationRepository
from app.repositories.records import AchievementRecord, UserStatsRecord
from app.services.achievement_snapshot_builder import AchievementSnapshotBuilder


@dataclass(frozen=True)
class AchievementStatus:
    achievement: AchievementRecord
    unlocked: bool
    earned_at: datetime | None

class GamificationService:
    """Orquestra estatísticas e o ciclo de desbloqueio de conquistas.

    A composição do estado usado para avaliar conquistas (módulos concluídos,
    perfil de saúde, consultas agendadas...) fica no `AchievementSnapshotBuilder`
    — este service cuida só de buscar stats, decidir o que desbloquear e
    persistir o resultado.
    """

    def __init__(
        self,
        gamification_repository: GamificationRepository,
        snapshot_builder: AchievementSnapshotBuilder,
        evaluator: AchievementEvaluator,
        clock: BusinessClock,
    ) -> None:
        self._gamification_repository = gamification_repository
        self._snapshot_builder = snapshot_builder
        self._evaluator = evaluator
        self._clock = clock

    def get_stats(self, user_id: UUID) -> UserStatsRecord:
        stats = self._gamification_repository.get_stats(user_id)
        if stats is None:
            raise EntityNotFoundError("Estatísticas", str(user_id))
        return stats

    def list_achievements(self, user_id: UUID) -> list[AchievementStatus]:
        achievements = self._gamification_repository.list_active_achievements()
        unlocked = self._gamification_repository.list_unlocked_achievements(user_id)
        visible_by_id = {
            ua.achievement_id: ua
            for ua in unlocked
            if ua.visible_on <= self._clock.today()
        }

        return [
            AchievementStatus(
                achievement=achievement,
                unlocked=achievement.id in visible_by_id,
                earned_at=(
                    visible_by_id[achievement.id].earned_at
                    if achievement.id in visible_by_id
                    else None
                ),
            )
            for achievement in achievements
        ]

    def evaluate_and_unlock(self, user_id: UUID) -> None:
        """Reavalia todas as conquistas do usuário e persiste as recém-obtidas.

        Chamado pelos demais services após qualquer ação que possa desbloquear
        uma conquista (concluir escovação, registrar fio dental, completar
        módulo educacional, completar o perfil de saúde, agendar consulta).
        """
        stats = self._gamification_repository.get_stats(user_id)
        if stats is None:
            return

        achievements = self._gamification_repository.list_active_achievements()
        unlocked = self._gamification_repository.list_unlocked_achievements(user_id)
        already_unlocked_ids = {ua.achievement_id for ua in unlocked}

        snapshot = self._snapshot_builder.build(user_id, stats)

        newly_unlocked = self._evaluator.evaluate(achievements, snapshot, already_unlocked_ids)
        for achievement in newly_unlocked:
            self._gamification_repository.unlock_achievement(achievement.id)

    def claim_due_reveals(self) -> list[AchievementRecord]:
        return self._gamification_repository.claim_due_achievement_reveals()

    def acknowledge_reveals(self, achievement_ids: list[UUID]) -> None:
        self._gamification_repository.acknowledge_achievement_reveals(achievement_ids)
