from datetime import UTC, datetime
from uuid import UUID

from app.repositories.records import ClaimedAchievementEvaluationRecord
from app.services.notification_service import AchievementEvaluationDispatchService


class FixedClock:
    value = datetime(2026, 8, 19, 12, tzinfo=UTC)

    def now(self) -> datetime:
        return self.value


class FakeEvaluationRepository:
    def __init__(self, evaluations: list[ClaimedAchievementEvaluationRecord]) -> None:
        self.evaluations = evaluations
        self.completions: list[tuple] = []

    def claim_due_evaluations(self, batch_size: int, lease_seconds: int, now: datetime):
        assert (batch_size, lease_seconds, now) == (10, 300, FixedClock.value)
        return self.evaluations

    def complete_evaluation(self, *args) -> None:
        self.completions.append(args)


class FakeGamificationService:
    def __init__(self, failing_user_id: UUID | None = None) -> None:
        self.failing_user_id = failing_user_id
        self.calls: list[UUID] = []

    def evaluate_and_unlock(self, user_id: UUID) -> None:
        self.calls.append(user_id)
        if user_id == self.failing_user_id:
            raise RuntimeError("temporary failure")


def evaluation(user_id: UUID) -> ClaimedAchievementEvaluationRecord:
    return ClaimedAchievementEvaluationRecord(
        user_id=user_id,
        requested_version=3,
        lease_token=UUID(int=user_id.int + 10),
        attempt_count=1,
    )


def test_achievement_dispatch_completes_successful_evaluation() -> None:
    user_id = UUID(int=1)
    repository = FakeEvaluationRepository([evaluation(user_id)])
    service = AchievementEvaluationDispatchService(
        repository, FakeGamificationService(), FixedClock()
    )

    summary = service.dispatch_once()

    assert (summary.claimed, summary.succeeded, summary.retried) == (1, 1, 0)
    assert repository.completions[0][0:4] == (
        user_id,
        3,
        UUID(int=11),
        True,
    )


def test_achievement_dispatch_schedules_retry_without_stopping_batch() -> None:
    failing_user = UUID(int=1)
    succeeding_user = UUID(int=2)
    repository = FakeEvaluationRepository(
        [evaluation(failing_user), evaluation(succeeding_user)]
    )
    service = AchievementEvaluationDispatchService(
        repository, FakeGamificationService(failing_user), FixedClock()
    )

    summary = service.dispatch_once()

    assert (summary.claimed, summary.succeeded, summary.retried) == (2, 1, 1)
    assert repository.completions[0][3] is False
    assert repository.completions[1][3] is True
