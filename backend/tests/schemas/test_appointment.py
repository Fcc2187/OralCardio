from datetime import UTC

import pytest
from pydantic import ValidationError

from app.schemas.appointment import AppointmentInput, AppointmentPatchInput


def test_appointment_rejects_naive_datetime() -> None:
    with pytest.raises(ValidationError, match="fuso horário"):
        AppointmentInput.model_validate(
            {
                "scheduled_at": "2026-09-01T10:00:00",
                "appointment_type": "routine_checkup",
                "dentist_name": "Dra. Ana",
            }
        )


def test_appointment_normalizes_datetime_to_utc() -> None:
    appointment = AppointmentInput.model_validate(
        {
            "scheduled_at": "2026-09-01T10:00:00-03:00",
            "appointment_type": "routine_checkup",
            "dentist_name": "Dra. Ana",
        }
    )

    assert appointment.scheduled_at.tzinfo is UTC
    assert appointment.scheduled_at.hour == 13


def test_patch_allows_clearing_nullable_field() -> None:
    patch = AppointmentPatchInput.model_validate({"notes": None})

    assert patch.model_dump(exclude_unset=True) == {"notes": None}


def test_patch_rejects_clearing_required_field() -> None:
    with pytest.raises(ValidationError, match="não pode ser nulo"):
        AppointmentPatchInput.model_validate({"dentist_name": None})
