from dataclasses import replace
from datetime import UTC, datetime
from uuid import UUID, uuid4

from app.domain.enums import AppointmentStatus, AppointmentType
from app.repositories.records import AppointmentRecord


class FakeAppointmentRepository:
    def __init__(self) -> None:
        self._appointments: dict[UUID, AppointmentRecord] = {}
        self._idempotency_keys: dict[tuple[UUID, str], UUID] = {}

    def create(
        self,
        user_id: UUID,
        scheduled_at: str,
        appointment_type: AppointmentType,
        dentist_name: str,
        clinic_name: str | None,
        clinic_address: str | None,
        clinic_phone: str | None,
        notes: str | None,
        idempotency_key: str | None = None,
    ) -> AppointmentRecord:
        if idempotency_key is not None:
            existing_id = self._idempotency_keys.get((user_id, idempotency_key))
            if existing_id is not None:
                return self._appointments[existing_id]
        appointment_id = uuid4()
        now = datetime.now(UTC)
        record = AppointmentRecord(
            id=appointment_id,
            user_id=user_id,
            scheduled_at=datetime.fromisoformat(scheduled_at),
            appointment_type=appointment_type,
            dentist_name=dentist_name,
            clinic_name=clinic_name,
            clinic_address=clinic_address,
            clinic_phone=clinic_phone,
            notes=notes,
            status=AppointmentStatus.SCHEDULED,
            created_at=now,
            updated_at=now,
        )
        self._appointments[appointment_id] = record
        if idempotency_key is not None:
            self._idempotency_keys[(user_id, idempotency_key)] = appointment_id
        return record

    def get_by_id(self, appointment_id: UUID, user_id: UUID) -> AppointmentRecord | None:
        record = self._appointments.get(appointment_id)
        if record is None or record.user_id != user_id:
            return None
        return record

    def update(
        self, appointment_id: UUID, user_id: UUID, current: AppointmentRecord, values: dict
    ) -> AppointmentRecord:
        record = self._appointments[appointment_id]
        mapped = dict(values)
        if "appointment_type" in mapped:
            mapped["appointment_type"] = AppointmentType(mapped["appointment_type"])
        if "status" in mapped:
            mapped["status"] = AppointmentStatus(mapped["status"])
        if "scheduled_at" in mapped:
            mapped["scheduled_at"] = datetime.fromisoformat(mapped["scheduled_at"])
        updated = replace(
            record, **mapped, updated_at=datetime.now(UTC), version=record.version + 1
        )
        self._appointments[appointment_id] = updated
        return updated

    def delete(self, appointment_id: UUID, user_id: UUID) -> None:
        del self._appointments[appointment_id]

    def list_by_user(
        self,
        user_id: UUID,
        limit: int,
        offset: int,
        status: AppointmentStatus | None,
    ) -> list[AppointmentRecord]:
        items = [a for a in self._appointments.values() if a.user_id == user_id]
        if status is not None:
            items = [a for a in items if a.status == status]
        items.sort(key=lambda a: a.scheduled_at, reverse=True)
        return items[offset : offset + limit]

    def has_any(self, user_id: UUID) -> bool:
        return any(a.user_id == user_id for a in self._appointments.values())
