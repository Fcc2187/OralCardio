from dataclasses import replace
from datetime import date, timedelta
from uuid import UUID, uuid4

from app.domain.achievements import AchievementEvaluator
from app.domain.enums import AchievementConditionType
from app.repositories.records import AchievementRecord, UserStatsRecord
from app.services.achievement_snapshot_builder import AchievementSnapshotBuilder
from app.services.gamification_service import GamificationService
from tests.fakes.appointment_repository import FakeAppointmentRepository
from tests.fakes.clock import FakeBusinessClock
from tests.fakes.education_repository import FakeEducationRepository
from tests.fakes.gamification_repository import FakeGamificationRepository
from tests.fakes.health_profile_repository import FakeHealthProfileRepository

_TODAY = date(2026, 8, 17)


def _build_service(
    stats: UserStatsRecord, achievements: list[AchievementRecord]
) -> tuple[GamificationService, FakeGamificationRepository, FakeBusinessClock]:
    snapshot_builder = AchievementSnapshotBuilder(
        education_repository=FakeEducationRepository(),
        health_profile_repository=FakeHealthProfileRepository(),
        appointment_repository=FakeAppointmentRepository(),
    )
    clock = FakeBusinessClock(_TODAY)
    repository = FakeGamificationRepository(
        stats=stats, achievements=achievements, business_date=clock.today()
    )
    service = GamificationService(
        gamification_repository=repository,
        snapshot_builder=snapshot_builder,
        evaluator=AchievementEvaluator(),
        clock=clock,
    )
    return service, repository, clock


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
    service, repository, clock = _build_service(stats, [achievement])

    service.evaluate_and_unlock(user_id)

    statuses = service.list_achievements(user_id)
    assert statuses[0].unlocked is False
    assert statuses[0].earned_at is None

    clock.current_date += timedelta(days=1)
    repository.business_date = clock.today()
    statuses = service.list_achievements(user_id)
    assert statuses[0].unlocked is True
    assert service.claim_due_reveals() == [achievement]

    service.acknowledge_reveals([achievement.id])
    assert service.claim_due_reveals() == []


def test_evaluate_and_unlock_is_idempotent(user_id: UUID, empty_stats: UserStatsRecord) -> None:
    achievement = _brushing_achievement(condition_value=1)
    stats = replace(empty_stats, total_brushings=1)
    service, repository, _ = _build_service(stats, [achievement])

    service.evaluate_and_unlock(user_id)
    service.evaluate_and_unlock(user_id)

    assert len(repository.list_unlocked_achievements(user_id)) == 1


def test_evaluate_and_unlock_does_not_unlock_below_threshold(
    user_id: UUID, empty_stats: UserStatsRecord
) -> None:
    achievement = _brushing_achievement(condition_value=50)
    stats = replace(empty_stats, total_brushings=1)
    service, repository, _ = _build_service(stats, [achievement])

    service.evaluate_and_unlock(user_id)

    assert repository.list_unlocked_achievements(user_id) == []


def test_hidden_achievement_does_not_expose_earned_at(
    user_id: UUID, empty_stats: UserStatsRecord
) -> None:
    achievement = _brushing_achievement()
    service, _, _ = _build_service(replace(empty_stats, total_brushings=1), [achievement])
    service.evaluate_and_unlock(user_id)
    status = service.list_achievements(user_id)[0]
    assert status.unlocked is False
    assert status.earned_at is None


def test_reveal_remains_available_when_user_returns_days_later(
    user_id: UUID, empty_stats: UserStatsRecord
) -> None:
    achievement = _brushing_achievement()
    service, repository, clock = _build_service(
        replace(empty_stats, total_brushings=1), [achievement]
    )
    service.evaluate_and_unlock(user_id)
    clock.current_date += timedelta(days=3)
    repository.business_date = clock.today()
    assert service.claim_due_reveals() == [achievement]


def test_acknowledge_empty_reveal_list_is_idempotent(empty_stats: UserStatsRecord) -> None:
    service, _, _ = _build_service(empty_stats, [])
    service.acknowledge_reveals([])
    assert service.claim_due_reveals() == []


def test_claim_returns_all_due_achievements(
    user_id: UUID, empty_stats: UserStatsRecord
) -> None:
    first = _brushing_achievement()
    second = _brushing_achievement()
    service, repository, clock = _build_service(
        replace(empty_stats, total_brushings=1), [first, second]
    )
    service.evaluate_and_unlock(user_id)
    clock.current_date += timedelta(days=1)
    repository.business_date = clock.today()
    assert {achievement.id for achievement in service.claim_due_reveals()} == {
        first.id,
        second.id,
    }
