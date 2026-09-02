from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import UUID, uuid4

import pytest

from app.core.exceptions import BusinessRuleViolationError, EntityNotFoundError
from app.domain.enums import AppointmentStatus, AppointmentType
from app.services.appointment_service import AppointmentService
from tests.fakes.appointment_repository import FakeAppointmentRepository


class _SpyGamificationService:
    def __init__(self) -> None:
        self.evaluate_calls: list[UUID] = []

    def evaluate_after_mutation(self, user_id: UUID) -> None:
        self.evaluate_calls.append(user_id)


@dataclass(frozen=True)
class _FakeInstantClock:
    current: datetime

    def now(self) -> datetime:
        return self.current


@pytest.fixture
def gamification_spy() -> _SpyGamificationService:
    return _SpyGamificationService()


@pytest.fixture
def service(gamification_spy: _SpyGamificationService) -> AppointmentService:
    return AppointmentService(
        FakeAppointmentRepository(),
        gamification_spy,
        _FakeInstantClock(datetime(2026, 8, 28, 12, tzinfo=UTC)),
    )


def _create(service: AppointmentService, user_id: UUID):
    result = service.create_appointment(
        user_id=user_id,
        scheduled_at="2026-09-01T10:00:00+00:00",
        appointment_type=AppointmentType.ROUTINE_CHECKUP,
        dentist_name="Dra. Ana",
        clinic_name=None,
        clinic_address=None,
        clinic_phone=None,
        notes=None,
    )
    return result


def test_create_appointment_triggers_achievement_evaluation(
    service: AppointmentService, user_id: UUID, gamification_spy: _SpyGamificationService
) -> None:
    appointment = _create(service, user_id)

    assert appointment.status == AppointmentStatus.SCHEDULED
    assert gamification_spy.evaluate_calls == [user_id]


def test_valid_status_transition_succeeds(service: AppointmentService, user_id: UUID) -> None:
    appointment = _create(service, user_id)

    updated = service.update_appointment(
        appointment_id=appointment.id,
        user_id=user_id,
        changes={"status": AppointmentStatus.COMPLETED.value},
    )

    assert updated.status == AppointmentStatus.COMPLETED


def test_invalid_status_transition_is_rejected(service: AppointmentService, user_id: UUID) -> None:
    appointment = _create(service, user_id)
    service.update_appointment(
        appointment_id=appointment.id,
        user_id=user_id,
        changes={"status": AppointmentStatus.COMPLETED.value},
    )

    with pytest.raises(BusinessRuleViolationError):
        service.update_appointment(
            appointment_id=appointment.id,
            user_id=user_id,
            changes={"status": AppointmentStatus.SCHEDULED.value},
        )


def test_cannot_access_another_users_appointment(
    service: AppointmentService, user_id: UUID
) -> None:
    appointment = _create(service, user_id)

    with pytest.raises(EntityNotFoundError):
        service.get_appointment(appointment.id, uuid4())


def test_create_appointment_is_idempotent_when_key_is_reused(
    service: AppointmentService, user_id: UUID
) -> None:
    values = {
        "user_id": user_id,
        "scheduled_at": "2026-09-01T10:00:00+00:00",
        "appointment_type": AppointmentType.ROUTINE_CHECKUP,
        "dentist_name": "Dra. Ana",
        "clinic_name": None,
        "clinic_address": None,
        "clinic_phone": None,
        "notes": None,
        "idempotency_key": "request-123",
    }

    first = service.create_appointment(**values)
    second = service.create_appointment(**values)

    assert second.id == first.id


def test_next_scheduled_returns_the_nearest_future_appointment_for_the_user(
    user_id: UUID, gamification_spy: _SpyGamificationService
) -> None:
    service = AppointmentService(
        FakeAppointmentRepository(),
        gamification_spy,
        _FakeInstantClock(datetime(2026, 8, 28, 12, tzinfo=UTC)),
    )
    later = _create(service, user_id)
    nearest = service.create_appointment(
        user_id=user_id,
        scheduled_at="2026-08-30T10:00:00+00:00",
        appointment_type=AppointmentType.CLEANING,
        dentist_name="Dr. Bruno",
        clinic_name=None,
        clinic_address=None,
        clinic_phone=None,
        notes=None,
    )
    _create(service, uuid4())

    result = service.get_next_scheduled(user_id)

    assert result is not None
    assert result.id == nearest.id
    assert result.id != later.id
