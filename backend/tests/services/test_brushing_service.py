from uuid import UUID, uuid4

import pytest

from app.core.exceptions import BusinessRuleViolationError, EntityNotFoundError
from app.domain.enums import BrushingZone
from app.services.brushing_service import BrushingService
from tests.fakes.brushing_repository import FakeBrushingRepository


class _SpyGamificationService:
    def __init__(self) -> None:
        self.evaluate_calls: list[UUID] = []

    def evaluate_after_mutation(self, user_id: UUID) -> None:
        self.evaluate_calls.append(user_id)


@pytest.fixture
def gamification_spy() -> _SpyGamificationService:
    return _SpyGamificationService()


@pytest.fixture
def service(gamification_spy: _SpyGamificationService) -> BrushingService:
    return BrushingService(FakeBrushingRepository(), gamification_spy)


def test_complete_session_requires_all_five_zones(
    service: BrushingService, user_id: UUID
) -> None:
    session = service.start_session(user_id)

    with pytest.raises(BusinessRuleViolationError):
        service.complete_session(session.id, user_id)


def test_complete_session_succeeds_after_all_zones_marked(
    service: BrushingService, user_id: UUID, gamification_spy: _SpyGamificationService
) -> None:
    session = service.start_session(user_id)
    for zone in BrushingZone:
        session = service.mark_zone_completed(session.id, user_id, zone)

    result = service.complete_session(session.id, user_id)

    assert result.is_completed is True
    assert gamification_spy.evaluate_calls == [user_id]


def test_complete_session_is_idempotent(service: BrushingService, user_id: UUID) -> None:
    session = service.start_session(user_id)
    for zone in BrushingZone:
        service.mark_zone_completed(session.id, user_id, zone)
    first_completion = service.complete_session(session.id, user_id)

    second_completion = service.complete_session(session.id, user_id)

    assert second_completion == first_completion


def test_idempotent_completion_does_not_revaluate_achievements(
    service: BrushingService, user_id: UUID, gamification_spy: _SpyGamificationService
) -> None:
    session = service.start_session(user_id)
    for zone in BrushingZone:
        service.mark_zone_completed(session.id, user_id, zone)
    service.complete_session(session.id, user_id)
    service.complete_session(session.id, user_id)
    assert gamification_spy.evaluate_calls == [user_id]


def test_multiple_completed_sessions_are_independent(
    service: BrushingService, user_id: UUID, gamification_spy: _SpyGamificationService
) -> None:
    for _ in range(2):
        session = service.start_session(user_id)
        for zone in BrushingZone:
            service.mark_zone_completed(session.id, user_id, zone)
        service.complete_session(session.id, user_id)
    assert gamification_spy.evaluate_calls == [user_id, user_id]


def test_mark_zone_on_completed_session_raises(service: BrushingService, user_id: UUID) -> None:
    session = service.start_session(user_id)
    for zone in BrushingZone:
        service.mark_zone_completed(session.id, user_id, zone)
    service.complete_session(session.id, user_id)

    with pytest.raises(BusinessRuleViolationError):
        service.mark_zone_completed(session.id, user_id, BrushingZone.TONGUE)


def test_cannot_access_another_users_session(service: BrushingService, user_id: UUID) -> None:
    session = service.start_session(user_id)
    other_user_id = uuid4()

    with pytest.raises(EntityNotFoundError):
        service.complete_session(session.id, other_user_id)


def test_start_session_is_idempotent_when_key_is_reused(
    service: BrushingService, user_id: UUID
) -> None:
    first = service.start_session(user_id, "request-123")
    second = service.start_session(user_id, "request-123")

    assert second.id == first.id
