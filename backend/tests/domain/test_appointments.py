import pytest

from app.core.exceptions import BusinessRuleViolationError
from app.domain.appointments import validate_status_transition
from app.domain.enums import AppointmentStatus


@pytest.mark.parametrize(
    ("current", "new"),
    [
        (AppointmentStatus.SCHEDULED, AppointmentStatus.COMPLETED),
        (AppointmentStatus.SCHEDULED, AppointmentStatus.CANCELLED),
        (AppointmentStatus.SCHEDULED, AppointmentStatus.RESCHEDULED),
        (AppointmentStatus.RESCHEDULED, AppointmentStatus.SCHEDULED),
    ],
)
def test_valid_transitions_do_not_raise(
    current: AppointmentStatus, new: AppointmentStatus
) -> None:
    validate_status_transition(current, new)


@pytest.mark.parametrize(
    ("current", "new"),
    [
        (AppointmentStatus.COMPLETED, AppointmentStatus.SCHEDULED),
        (AppointmentStatus.CANCELLED, AppointmentStatus.SCHEDULED),
        (AppointmentStatus.RESCHEDULED, AppointmentStatus.COMPLETED),
        (AppointmentStatus.RESCHEDULED, AppointmentStatus.CANCELLED),
        (AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED),
    ],
)
def test_invalid_transitions_raise(current: AppointmentStatus, new: AppointmentStatus) -> None:
    with pytest.raises(BusinessRuleViolationError):
        validate_status_transition(current, new)


def test_repeating_current_status_is_idempotent() -> None:
    validate_status_transition(AppointmentStatus.COMPLETED, AppointmentStatus.COMPLETED)
    validate_status_transition(AppointmentStatus.SCHEDULED, AppointmentStatus.SCHEDULED)
