from uuid import UUID

import pytest

from app.services.flossing_service import FlossingService
from tests.fakes.flossing_repository import FakeFlossingRepository


class _SpyGamificationService:
    def __init__(self) -> None:
        self.evaluate_calls: list[UUID] = []

    def evaluate_and_unlock(self, user_id: UUID) -> None:
        self.evaluate_calls.append(user_id)


@pytest.fixture
def gamification_spy() -> _SpyGamificationService:
    return _SpyGamificationService()


@pytest.fixture
def service(gamification_spy: _SpyGamificationService) -> FlossingService:
    return FlossingService(FakeFlossingRepository(), gamification_spy)


def test_log_flossing_persists_and_triggers_evaluation(
    service: FlossingService, user_id: UUID, gamification_spy: _SpyGamificationService
) -> None:
    result = service.log_flossing(user_id, notes="Fio dental após o jantar")

    assert result.notes == "Fio dental após o jantar"
    assert gamification_spy.evaluate_calls == [user_id]


def test_list_logs_returns_entries_for_user(service: FlossingService, user_id: UUID) -> None:
    service.log_flossing(user_id, notes="Primeiro registro")
    service.log_flossing(user_id, notes="Segundo registro")

    logs = service.list_logs(user_id, limit=20, offset=0)

    assert len(logs) == 2


def test_every_flossing_log_triggers_achievement_evaluation(
    service: FlossingService, user_id: UUID, gamification_spy: _SpyGamificationService
) -> None:
    service.log_flossing(user_id, notes=None)
    service.log_flossing(user_id, notes=None)
    assert gamification_spy.evaluate_calls == [user_id, user_id]


def test_flossing_logs_remain_distinct_when_created_repeatedly(
    service: FlossingService, user_id: UUID
) -> None:
    first = service.log_flossing(user_id, notes=None)
    second = service.log_flossing(user_id, notes=None)
    assert first.id != second.id
