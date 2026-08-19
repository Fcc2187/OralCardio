from uuid import UUID

import pytest

from app.domain.enums import CardiacCondition
from app.services.health_profile_service import HealthProfileService
from tests.fakes.health_profile_repository import FakeHealthProfileRepository


class _SpyGamificationService:
    def __init__(self) -> None:
        self.evaluate_calls: list[UUID] = []

    def evaluate_after_mutation(self, user_id: UUID) -> None:
        self.evaluate_calls.append(user_id)


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

    assert result.is_completed is True
    assert gamification_spy.evaluate_calls == [user_id]
