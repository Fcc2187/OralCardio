from uuid import UUID

from app.core.exceptions import EntityNotFoundError
from app.domain.enums import AppointmentStatus, AppointmentType
from app.repositories.base import SupabaseRepository
from app.repositories.parsing import parse_required_datetime
from app.repositories.records import AppointmentRecord

_TABLE = "appointments"


def _to_record(row: dict) -> AppointmentRecord:
    return AppointmentRecord(
        id=UUID(row["id"]),
        user_id=UUID(row["user_id"]),
        scheduled_at=parse_required_datetime(row["scheduled_at"]),
        appointment_type=AppointmentType(row["appointment_type"]),
        dentist_name=row["dentist_name"],
        clinic_name=row.get("clinic_name"),
        clinic_address=row.get("clinic_address"),
        clinic_phone=row.get("clinic_phone"),
        notes=row.get("notes"),
        status=AppointmentStatus(row["status"]),
        created_at=parse_required_datetime(row["created_at"]),
        updated_at=parse_required_datetime(row["updated_at"]),
    )


class SupabaseAppointmentRepository(SupabaseRepository):
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
    ) -> AppointmentRecord:
        payload = {
            "user_id": str(user_id),
            "scheduled_at": scheduled_at,
            "appointment_type": appointment_type.value,
            "dentist_name": dentist_name,
            "clinic_name": clinic_name,
            "clinic_address": clinic_address,
            "clinic_phone": clinic_phone,
            "notes": notes,
        }

        def operation():
            response = self._client.table(_TABLE).insert(payload).execute()
            return response.data

        rows = self._run("Consulta", operation)
        return _to_record(rows[0])

    def get_by_id(self, appointment_id: UUID, user_id: UUID) -> AppointmentRecord | None:
        def operation():
            response = (
                self._client.table(_TABLE)
                .select("*")
                .eq("id", str(appointment_id))
                .eq("user_id", str(user_id))
                .maybe_single()
                .execute()
            )
            return self._maybe_single_data(response)

        row = self._run("Consulta", operation)
        return _to_record(row) if row else None

    def update(self, appointment_id: UUID, user_id: UUID, values: dict) -> AppointmentRecord:
        def operation():
            response = (
                self._client.table(_TABLE)
                .update(values)
                .eq("id", str(appointment_id))
                .eq("user_id", str(user_id))
                .execute()
            )
            return response.data

        rows = self._run("Consulta", operation)
        if not rows:
            raise EntityNotFoundError("Consulta", str(appointment_id))
        return _to_record(rows[0])

    def delete(self, appointment_id: UUID, user_id: UUID) -> None:
        def operation():
            response = (
                self._client.table(_TABLE)
                .delete()
                .eq("id", str(appointment_id))
                .eq("user_id", str(user_id))
                .execute()
            )
            return response.data

        rows = self._run("Consulta", operation)
        if not rows:
            raise EntityNotFoundError("Consulta", str(appointment_id))

    def list_by_user(
        self,
        user_id: UUID,
        limit: int,
        offset: int,
        status: AppointmentStatus | None,
    ) -> list[AppointmentRecord]:
        def operation():
            query = (
                self._client.table(_TABLE)
                .select("*")
                .eq("user_id", str(user_id))
                .order("scheduled_at", desc=True)
            )
            if status is not None:
                query = query.eq("status", status.value)
            response = query.range(offset, offset + limit - 1).execute()
            return response.data

        rows = self._run("Consulta", operation)
        return [_to_record(row) for row in rows]

    def has_any(self, user_id: UUID) -> bool:
        def operation():
            response = (
                self._client.table(_TABLE)
                .select("id", count="exact")
                .eq("user_id", str(user_id))
                .limit(1)
                .execute()
            )
            return response.count or 0

        return self._run("Consulta", operation) > 0
