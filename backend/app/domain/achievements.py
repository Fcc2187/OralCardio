from collections.abc import Callable
from dataclasses import dataclass
from uuid import UUID

from app.domain.enums import AchievementConditionType


@dataclass(frozen=True)
class Achievement:
    """Espelha uma linha da tabela `achievements` (catálogo administrativo)."""

    id: UUID
    condition_type: AchievementConditionType
    condition_value: int
    points_reward: int


@dataclass(frozen=True)
class AchievementSnapshot:
    """Estado do usuário no momento da avaliação, já agregado pelo service."""

    total_brushings: int
    current_streak_days: int
    total_flossings: int
    completed_modules_count: int
    total_active_modules: int
    has_completed_health_profile: bool
    has_scheduled_appointment: bool


_ConditionCheck = Callable[[Achievement, AchievementSnapshot], bool]


def _check_brushing_count(achievement: Achievement, snapshot: AchievementSnapshot) -> bool:
    return snapshot.total_brushings >= achievement.condition_value


def _check_streak_days(achievement: Achievement, snapshot: AchievementSnapshot) -> bool:
    return snapshot.current_streak_days >= achievement.condition_value


def _check_flossing_count(achievement: Achievement, snapshot: AchievementSnapshot) -> bool:
    return snapshot.total_flossings >= achievement.condition_value


def _check_module_completed(achievement: Achievement, snapshot: AchievementSnapshot) -> bool:
    return snapshot.completed_modules_count >= achievement.condition_value


def _check_all_modules_completed(achievement: Achievement, snapshot: AchievementSnapshot) -> bool:
    return (
        snapshot.total_active_modules > 0
        and snapshot.completed_modules_count >= snapshot.total_active_modules
    )


def _check_health_profile_completed(
    achievement: Achievement, snapshot: AchievementSnapshot
) -> bool:
    return snapshot.has_completed_health_profile


def _check_appointment_scheduled(achievement: Achievement, snapshot: AchievementSnapshot) -> bool:
    return snapshot.has_scheduled_appointment


_CONDITION_CHECKS: dict[AchievementConditionType, _ConditionCheck] = {
    AchievementConditionType.BRUSHING_COUNT: _check_brushing_count,
    AchievementConditionType.STREAK_DAYS: _check_streak_days,
    AchievementConditionType.FLOSSING_COUNT: _check_flossing_count,
    AchievementConditionType.MODULE_COMPLETED: _check_module_completed,
    AchievementConditionType.ALL_MODULES_COMPLETED: _check_all_modules_completed,
    AchievementConditionType.HEALTH_PROFILE_COMPLETED: _check_health_profile_completed,
    AchievementConditionType.APPOINTMENT_SCHEDULED: _check_appointment_scheduled,
}


class AchievementEvaluator:
    """Determina quais conquistas um usuário acabou de desbloquear.

    Cada tipo de condição é uma estratégia isolada em `_CONDITION_CHECKS`.
    Adicionar uma nova condição no futuro significa escrever uma função nova e
    registrá-la no mapa — nenhuma lógica existente precisa ser alterada
    (Open/Closed).
    """

    def evaluate(
        self,
        achievements: list[Achievement],
        snapshot: AchievementSnapshot,
        already_unlocked_ids: set[UUID],
    ) -> list[Achievement]:
        newly_unlocked: list[Achievement] = []

        for achievement in achievements:
            if achievement.id in already_unlocked_ids:
                continue

            check = _CONDITION_CHECKS.get(achievement.condition_type)
            if check is not None and check(achievement, snapshot):
                newly_unlocked.append(achievement)

        return newly_unlocked
