from dataclasses import replace as _replace
from uuid import uuid4

from app.domain.achievements import Achievement, AchievementEvaluator, AchievementSnapshot
from app.domain.enums import AchievementConditionType

_BASE_SNAPSHOT = AchievementSnapshot(
    total_brushings=0,
    current_streak_days=0,
    total_flossings=0,
    completed_modules_count=0,
    total_active_modules=6,
    has_completed_health_profile=False,
    has_scheduled_appointment=False,
)


def _achievement(condition_type: AchievementConditionType, condition_value: int) -> Achievement:
    return Achievement(
        id=uuid4(), condition_type=condition_type, condition_value=condition_value, points_reward=10
    )


def test_brushing_count_achievement_unlocks_when_threshold_reached() -> None:
    achievement = _achievement(AchievementConditionType.BRUSHING_COUNT, 50)
    snapshot = _replace(_BASE_SNAPSHOT, total_brushings=50)

    unlocked = AchievementEvaluator().evaluate([achievement], snapshot, set())

    assert unlocked == [achievement]


def test_streak_days_achievement_stays_locked_below_threshold() -> None:
    achievement = _achievement(AchievementConditionType.STREAK_DAYS, 7)
    snapshot = _replace(_BASE_SNAPSHOT, current_streak_days=6)

    unlocked = AchievementEvaluator().evaluate([achievement], snapshot, set())

    assert unlocked == []


def test_flossing_count_achievement_unlocks_when_threshold_reached() -> None:
    achievement = _achievement(AchievementConditionType.FLOSSING_COUNT, 30)
    snapshot = _replace(_BASE_SNAPSHOT, total_flossings=30)

    unlocked = AchievementEvaluator().evaluate([achievement], snapshot, set())

    assert unlocked == [achievement]


def test_module_completed_achievement_unlocks_with_at_least_one_completed() -> None:
    achievement = _achievement(AchievementConditionType.MODULE_COMPLETED, 1)
    snapshot = _replace(_BASE_SNAPSHOT, completed_modules_count=1)

    unlocked = AchievementEvaluator().evaluate([achievement], snapshot, set())

    assert unlocked == [achievement]


def test_all_modules_completed_requires_every_active_module() -> None:
    achievement = _achievement(AchievementConditionType.ALL_MODULES_COMPLETED, 1)
    partially_done = _replace(_BASE_SNAPSHOT, completed_modules_count=5, total_active_modules=6)
    fully_done = _replace(_BASE_SNAPSHOT, completed_modules_count=6, total_active_modules=6)

    assert AchievementEvaluator().evaluate([achievement], partially_done, set()) == []
    assert AchievementEvaluator().evaluate([achievement], fully_done, set()) == [achievement]


def test_health_profile_completed_achievement() -> None:
    achievement = _achievement(AchievementConditionType.HEALTH_PROFILE_COMPLETED, 1)
    snapshot = _replace(_BASE_SNAPSHOT, has_completed_health_profile=True)

    unlocked = AchievementEvaluator().evaluate([achievement], snapshot, set())

    assert unlocked == [achievement]


def test_appointment_scheduled_achievement() -> None:
    achievement = _achievement(AchievementConditionType.APPOINTMENT_SCHEDULED, 1)
    snapshot = _replace(_BASE_SNAPSHOT, has_scheduled_appointment=True)

    unlocked = AchievementEvaluator().evaluate([achievement], snapshot, set())

    assert unlocked == [achievement]


def test_already_unlocked_achievements_are_never_returned_again() -> None:
    achievement = _achievement(AchievementConditionType.BRUSHING_COUNT, 1)
    snapshot = _replace(_BASE_SNAPSHOT, total_brushings=100)

    unlocked = AchievementEvaluator().evaluate([achievement], snapshot, {achievement.id})

    assert unlocked == []
