from uuid import UUID, uuid4

import pytest

from app.core.exceptions import BusinessRuleViolationError, EntityNotFoundError
from app.domain.enums import AppointmentStatus, AppointmentType
from app.services.appointment_service import AppointmentService
from tests.fakes.appointment_repository import FakeAppointmentRepository


class _SpyGamificationService:
    def __init__(self) -> None:
        self.evaluate_calls: list[UUID] = []

    def evaluate_and_unlock(self, user_id: UUID) -> list:
        self.evaluate_calls.append(user_id)
        return []


@pytest.fixture
def gamification_spy() -> _SpyGamificationService:
    return _SpyGamificationService()


@pytest.fixture
def service(gamification_spy: _SpyGamificationService) -> AppointmentService:
    return AppointmentService(FakeAppointmentRepository(), gamification_spy)


def _create(service: AppointmentService, user_id: UUID):
    return service.create_appointment(
        user_id=user_id,
        scheduled_at="2026-09-01T10:00:00+00:00",
        appointment_type=AppointmentType.ROUTINE_CHECKUP,
        dentist_name="Dra. Ana",
        clinic_name=None,
        clinic_address=None,
        clinic_phone=None,
        notes=None,
    )


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
        scheduled_at=None,
        appointment_type=None,
        dentist_name=None,
        clinic_name=None,
        clinic_address=None,
        clinic_phone=None,
        notes=None,
        status=AppointmentStatus.COMPLETED,
    )

    assert updated.status == AppointmentStatus.COMPLETED


def test_invalid_status_transition_is_rejected(service: AppointmentService, user_id: UUID) -> None:
    appointment = _create(service, user_id)
    service.update_appointment(
        appointment_id=appointment.id,
        user_id=user_id,
        scheduled_at=None,
        appointment_type=None,
        dentist_name=None,
        clinic_name=None,
        clinic_address=None,
        clinic_phone=None,
        notes=None,
        status=AppointmentStatus.COMPLETED,
    )

    with pytest.raises(BusinessRuleViolationError):
        service.update_appointment(
            appointment_id=appointment.id,
            user_id=user_id,
            scheduled_at=None,
            appointment_type=None,
            dentist_name=None,
            clinic_name=None,
            clinic_address=None,
            clinic_phone=None,
            notes=None,
            status=AppointmentStatus.SCHEDULED,
        )


def test_cannot_access_another_users_appointment(
    service: AppointmentService, user_id: UUID
) -> None:
    appointment = _create(service, user_id)

    with pytest.raises(EntityNotFoundError):
        service.get_appointment(appointment.id, uuid4())
