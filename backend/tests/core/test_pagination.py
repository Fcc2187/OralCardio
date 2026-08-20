from datetime import UTC, datetime
from uuid import UUID

import pytest

from app.core.exceptions import BusinessRuleViolationError
from app.core.pagination import (
    AppointmentCursor,
    decode_appointment_cursor,
    encode_appointment_cursor,
)


def test_appointment_cursor_round_trip_preserves_ordering_fields() -> None:
    cursor = AppointmentCursor(
        scheduled_at=datetime(2026, 8, 20, 10, 30, tzinfo=UTC),
        appointment_id=UUID("00000000-0000-0000-0000-000000000123"),
    )

    decoded = decode_appointment_cursor(encode_appointment_cursor(cursor))

    assert decoded == cursor


@pytest.mark.parametrize(
    "value",
    ["not-base64", "e30", "eyJpZCI6Im5vdC1hLXV1aWQifQ"],
)
def test_appointment_cursor_rejects_invalid_values(value: str) -> None:
    with pytest.raises(BusinessRuleViolationError, match="Cursor"):
        decode_appointment_cursor(value)
