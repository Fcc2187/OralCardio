from dataclasses import replace
from uuid import UUID, uuid4

from app.domain.achievements import AchievementEvaluator
from app.domain.enums import AchievementConditionType
from app.repositories.records import AchievementRecord, UserStatsRecord
from app.services.gamification_service import GamificationService
from tests.fakes.education_repository import FakeEducationRepository
from tests.fakes.gamification_repository import FakeGamificationRepository
from tests.fakes.health_profile_repository import FakeHealthProfileRepository


def _build_service(
    stats: UserStatsRecord, achievements: list[AchievementRecord]
) -> GamificationService:
    return GamificationService(
        gamification_repository=FakeGamificationRepository(
            stats=stats, achievements=achievements
        ),
        education_repository=FakeEducationRepository(),
        health_profile_repository=FakeHealthProfileRepository(),
        evaluator=AchievementEvaluator(),
    )


def _brushing_achievement(condition_value: int = 1) -> AchievementRecord:
    return AchievementRecord(
        id=uuid4(),
        name="Primeira Escovação",
        description="1ª sessão completada",
        icon="🦷",
        condition_type=AchievementConditionType.BRUSHING_COUNT,
        condition_value=condition_value,
        points_reward=10,
    )


def test_evaluate_and_unlock_persists_newly_earned_achievement(
    user_id: UUID, empty_stats: UserStatsRecord
) -> None:
    achievement = _brushing_achievement(condition_value=1)
    stats = replace(empty_stats, total_brushings=1)
    service = _build_service(stats, [achievement])

    newly_unlocked = service.evaluate_and_unlock(user_id)

    assert [a.id for a in newly_unlocked] == [achievement.id]
    statuses = service.list_achievements(user_id)
    assert statuses[0].unlocked is True


def test_evaluate_and_unlock_is_idempotent(user_id: UUID, empty_stats: UserStatsRecord) -> None:
    achievement = _brushing_achievement(condition_value=1)
    stats = replace(empty_stats, total_brushings=1)
    service = _build_service(stats, [achievement])

    first_call = service.evaluate_and_unlock(user_id)
    second_call = service.evaluate_and_unlock(user_id)

    assert len(first_call) == 1
    assert second_call == []


def test_evaluate_and_unlock_does_not_unlock_below_threshold(
    user_id: UUID, empty_stats: UserStatsRecord
) -> None:
    achievement = _brushing_achievement(condition_value=50)
    stats = replace(empty_stats, total_brushings=1)
    service = _build_service(stats, [achievement])

    newly_unlocked = service.evaluate_and_unlock(user_id)

    assert newly_unlocked == []
