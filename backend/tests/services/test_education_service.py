from uuid import UUID, uuid4

import pytest

from app.core.exceptions import EntityNotFoundError
from app.domain.enums import EducationCategory
from app.repositories.records import EducationModuleRecord
from app.services.education_service import EducationService
from tests.fakes.education_repository import FakeEducationRepository


class _SpyGamificationService:
    def __init__(self) -> None:
        self.evaluate_calls: list[UUID] = []

    def evaluate_after_mutation(self, user_id: UUID) -> None:
        self.evaluate_calls.append(user_id)


@pytest.fixture
def module() -> EducationModuleRecord:
    return EducationModuleRecord(
        id=uuid4(),
        title="A Conexão Entre Boca e Coração",
        slug="conexao-boca-coracao",
        description="...",
        content={"sections": []},
        category=EducationCategory.MOUTH_HEART_CONNECTION.value,
        order_index=1,
        estimated_minutes=5,
        thumbnail_url=None,
        is_active=True,
    )


@pytest.fixture
def gamification_spy() -> _SpyGamificationService:
    return _SpyGamificationService()


@pytest.fixture
def service(
    module: EducationModuleRecord, gamification_spy: _SpyGamificationService
) -> EducationService:
    return EducationService(FakeEducationRepository([module]), gamification_spy)


def test_complete_module_unlocks_progress_and_triggers_evaluation(
    service: EducationService,
    module: EducationModuleRecord,
    user_id: UUID,
    gamification_spy: _SpyGamificationService,
) -> None:
    result = service.complete_module(user_id, module.id, read_time_seconds=120)

    assert result.progress is not None
    assert result.progress.is_completed is True
    assert gamification_spy.evaluate_calls == [user_id]


def test_complete_module_twice_does_not_recount(
    service: EducationService,
    module: EducationModuleRecord,
    user_id: UUID,
    gamification_spy: _SpyGamificationService,
) -> None:
    service.complete_module(user_id, module.id, read_time_seconds=120)
    service.complete_module(user_id, module.id, read_time_seconds=999)

    # Segunda chamada não deve reavaliar conquistas nem sobrescrever o progresso.
    assert gamification_spy.evaluate_calls == [user_id]


def test_complete_inactive_module_raises_not_found(
    service: EducationService, user_id: UUID
) -> None:
    with pytest.raises(EntityNotFoundError):
        service.complete_module(user_id, uuid4(), read_time_seconds=None)
