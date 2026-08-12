from uuid import UUID

import pytest

from app.domain.enums import CardiacCondition
from app.services.health_profile_service import HealthProfileService
from tests.fakes.health_profile_repository import FakeHealthProfileRepository


class _SpyGamificationService:
    def __init__(self, unlocked: list | None = None) -> None:
        self.evaluate_calls: list[UUID] = []
        self._unlocked = unlocked or []

    def evaluate_and_unlock(self, user_id: UUID) -> list:
        self.evaluate_calls.append(user_id)
        return self._unlocked


@pytest.fixture
def gamification_spy() -> _SpyGamificationService:
    return _SpyGamificationService()


@pytest.fixture
def service(gamification_spy: _SpyGamificationService) -> HealthProfileService:
    return HealthProfileService(FakeHealthProfileRepository(), gamification_spy)


def _submit(service: HealthProfileService, user_id: UUID):
    return service.submit_questionnaire(
        user_id=user_id,
        cardiac_condition=CardiacCondition.ARRHYTHMIA,
        cardiac_condition_detail=None,
        has_pacemaker=False,
        has_prosthetic_valve=False,
        medications=[],
        allergies=[],
        last_dental_visit=None,
        brushing_frequency_before=2,
        dentist_name=None,
        dentist_phone=None,
        cardiologist_name=None,
    )


def test_submit_questionnaire_marks_profile_as_completed(
    service: HealthProfileService, user_id: UUID, gamification_spy: _SpyGamificationService
) -> None:
    result = _submit(service, user_id)

    assert result.value.is_completed is True
    assert gamification_spy.evaluate_calls == [user_id]


def test_submit_questionnaire_propagates_newly_unlocked_achievements(user_id: UUID) -> None:
    fake_achievement = object()
    spy = _SpyGamificationService(unlocked=[fake_achievement])
    service = HealthProfileService(FakeHealthProfileRepository(), spy)

    result = _submit(service, user_id)

    assert result.unlocked_achievements == [fake_achievement]
