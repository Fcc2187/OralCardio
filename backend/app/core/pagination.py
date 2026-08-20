"""Cursores opacos e validados para paginação ordenada por data e UUID."""

import base64
import binascii
import json
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from app.core.exceptions import BusinessRuleViolationError


@dataclass(frozen=True)
class AppointmentCursor:
    scheduled_at: datetime
    appointment_id: UUID


def encode_appointment_cursor(value: AppointmentCursor) -> str:
    raw = json.dumps(
        {"scheduled_at": value.scheduled_at.isoformat(), "id": str(value.appointment_id)},
        separators=(",", ":"),
    ).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def decode_appointment_cursor(value: str) -> AppointmentCursor:
    try:
        padded = value + "=" * (-len(value) % 4)
        raw = base64.urlsafe_b64decode(padded.encode("ascii"))
        payload = json.loads(raw.decode("utf-8"))
        scheduled_at = datetime.fromisoformat(payload["scheduled_at"].replace("Z", "+00:00"))
        appointment_id = UUID(payload["id"])
    except (KeyError, TypeError, ValueError, UnicodeDecodeError, binascii.Error) as exc:
        raise BusinessRuleViolationError("Cursor de paginação inválido") from exc
    if scheduled_at.tzinfo is None or scheduled_at.utcoffset() is None:
        raise BusinessRuleViolationError("Cursor de paginação inválido")
    return AppointmentCursor(scheduled_at=scheduled_at, appointment_id=appointment_id)
