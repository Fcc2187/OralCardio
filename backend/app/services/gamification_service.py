from dataclasses import dataclass
from datetime import datetime
from typing import Generic, TypeVar
from uuid import UUID

from app.core.exceptions import EntityNotFoundError
from app.domain.achievements import AchievementEvaluator
from app.repositories.interfaces import GamificationRepository
from app.repositories.records import AchievementRecord, UserStatsRecord
from app.services.achievement_snapshot_builder import AchievementSnapshotBuilder

T = TypeVar("T")


@dataclass(frozen=True)
class AchievementStatus:
    achievement: AchievementRecord
    unlocked: bool
    earned_at: datetime | None


@dataclass(frozen=True)
class GamifiedResult(Generic[T]):
    """Resultado de uma operação que pode desbloquear conquistas como efeito
    colateral (completar escovação, registrar fio dental, concluir módulo,
    completar perfil de saúde, agendar consulta).

    Carregar `unlocked_achievements` junto do resultado principal é o que
    permite a API devolver, numa única resposta atômica, tanto o recurso
    alterado quanto o que isso desbloqueou — sem o cliente precisar comparar
    o catálogo de conquistas antes e depois da chamada.
    """

    value: T
    unlocked_achievements: list[AchievementRecord]


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
    ) -> None:
        self._gamification_repository = gamification_repository
        self._snapshot_builder = snapshot_builder
        self._evaluator = evaluator

    def get_stats(self, user_id: UUID) -> UserStatsRecord:
        stats = self._gamification_repository.get_stats(user_id)
        if stats is None:
            raise EntityNotFoundError("Estatísticas", str(user_id))
        return stats

    def list_achievements(self, user_id: UUID) -> list[AchievementStatus]:
        achievements = self._gamification_repository.list_active_achievements()
        unlocked = self._gamification_repository.list_unlocked_achievements(user_id)
        earned_at_by_id = {ua.achievement_id: ua.earned_at for ua in unlocked}

        return [
            AchievementStatus(
                achievement=achievement,
                unlocked=achievement.id in earned_at_by_id,
                earned_at=earned_at_by_id.get(achievement.id),
            )
            for achievement in achievements
        ]

    def evaluate_and_unlock(self, user_id: UUID) -> list[AchievementRecord]:
        """Reavalia todas as conquistas do usuário e persiste as recém-obtidas.

        Chamado pelos demais services após qualquer ação que possa desbloquear
        uma conquista (concluir escovação, registrar fio dental, completar
        módulo educacional, completar o perfil de saúde, agendar consulta).
        """
        stats = self._gamification_repository.get_stats(user_id)
        if stats is None:
            return []

        achievements = self._gamification_repository.list_active_achievements()
        unlocked = self._gamification_repository.list_unlocked_achievements(user_id)
        already_unlocked_ids = {ua.achievement_id for ua in unlocked}

        snapshot = self._snapshot_builder.build(user_id, stats)

        newly_unlocked = self._evaluator.evaluate(achievements, snapshot, already_unlocked_ids)
        for achievement in newly_unlocked:
            self._gamification_repository.unlock_achievement(achievement.id)

        return newly_unlocked
