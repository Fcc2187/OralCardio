from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from app.core.exceptions import EntityNotFoundError
from app.domain.achievements import AchievementEvaluator, AchievementSnapshot
from app.repositories.interfaces import (
    EducationRepository,
    GamificationRepository,
    HealthProfileRepository,
)
from app.repositories.records import AchievementRecord, UserStatsRecord


@dataclass(frozen=True)
class AchievementStatus:
    achievement: AchievementRecord
    unlocked: bool
    earned_at: datetime | None


class GamificationService:
    """Orquestra estatísticas e o ciclo de desbloqueio de conquistas.

    É o único service que agrega dados de outros domínios (educação, perfil
    de saúde) porque a avaliação de conquistas é inerentemente transversal —
    concentrar essa composição aqui evita espalhar a regra "o que desbloqueia
    o quê" pelos demais services.
    """

    def __init__(
        self,
        gamification_repository: GamificationRepository,
        education_repository: EducationRepository,
        health_profile_repository: HealthProfileRepository,
        evaluator: AchievementEvaluator,
    ) -> None:
        self._gamification_repository = gamification_repository
        self._education_repository = education_repository
        self._health_profile_repository = health_profile_repository
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
        módulo educacional, completar o perfil de saúde).
        """
        stats = self._gamification_repository.get_stats(user_id)
        if stats is None:
            return []

        achievements = self._gamification_repository.list_active_achievements()
        unlocked = self._gamification_repository.list_unlocked_achievements(user_id)
        already_unlocked_ids = {ua.achievement_id for ua in unlocked}

        active_modules = self._education_repository.list_active_modules()
        progress = self._education_repository.list_progress_by_user(user_id)
        completed_modules_count = sum(1 for entry in progress if entry.is_completed)

        health_profile = self._health_profile_repository.get_by_user_id(user_id)

        snapshot = AchievementSnapshot(
            total_brushings=stats.total_brushings,
            current_streak_days=stats.current_streak_days,
            total_flossings=stats.total_flossings,
            completed_modules_count=completed_modules_count,
            total_active_modules=len(active_modules),
            has_completed_health_profile=bool(health_profile and health_profile.is_completed),
            has_scheduled_appointment=False,  # Agenda de consultas fica para a v2.
        )

        newly_unlocked = self._evaluator.evaluate(achievements, snapshot, already_unlocked_ids)
        for achievement in newly_unlocked:
            self._gamification_repository.unlock_achievement(achievement.id)

        return newly_unlocked