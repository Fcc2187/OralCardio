from uuid import UUID

from app.core.exceptions import EntityNotFoundError
from app.core.idempotency import request_fingerprint
from app.core.pagination import AppointmentCursor
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
        version=row.get("version", 1),
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
        idempotency_key: str | None,
    ) -> AppointmentRecord:
        def operation():
            response = self._client.rpc(
                "create_appointment_v2",
                {
                    "p_scheduled_at": scheduled_at,
                    "p_appointment_type": appointment_type.value,
                    "p_dentist_name": dentist_name,
                    "p_clinic_name": clinic_name,
                    "p_clinic_address": clinic_address,
                    "p_clinic_phone": clinic_phone,
                    "p_notes": notes,
                    "p_idempotency_key": idempotency_key,
                    "p_request_hash": request_fingerprint(
                        {
                            "scheduled_at": scheduled_at,
                            "appointment_type": appointment_type.value,
                            "dentist_name": dentist_name,
                            "clinic_name": clinic_name,
                            "clinic_address": clinic_address,
                            "clinic_phone": clinic_phone,
                            "notes": notes,
                        }
                    ),
                },
            ).execute()
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

    def update(
        self, appointment_id: UUID, user_id: UUID, current: AppointmentRecord, values: dict
    ) -> AppointmentRecord:
        merged = {
            "scheduled_at": current.scheduled_at.isoformat(),
            "appointment_type": current.appointment_type.value,
            "dentist_name": current.dentist_name,
            "clinic_name": current.clinic_name,
            "clinic_address": current.clinic_address,
            "clinic_phone": current.clinic_phone,
            "notes": current.notes,
            "status": current.status.value,
            **values,
        }

        def operation():
            response = self._client.rpc(
                "update_appointment_v2",
                {
                    "p_appointment_id": str(appointment_id),
                    "p_expected_version": current.version,
                    "p_scheduled_at": merged["scheduled_at"],
                    "p_appointment_type": merged["appointment_type"],
                    "p_dentist_name": merged["dentist_name"],
                    "p_clinic_name": merged["clinic_name"],
                    "p_clinic_address": merged["clinic_address"],
                    "p_clinic_phone": merged["clinic_phone"],
                    "p_notes": merged["notes"],
                    "p_status": merged["status"],
                },
            ).execute()
            return response.data

        rows = self._run("Consulta", operation)
        if not rows:
            raise EntityNotFoundError("Consulta", str(appointment_id))
        return _to_record(rows[0])

    def delete(self, appointment_id: UUID, user_id: UUID) -> None:
        def operation():
            self._client.rpc(
                "delete_appointment_v2", {"p_appointment_id": str(appointment_id)}
            ).execute()
            return True

        rows = self._run("Consulta", operation)
        if not rows:
            raise EntityNotFoundError("Consulta", str(appointment_id))

    def list_by_user(
        self,
        user_id: UUID,
        limit: int,
        cursor: AppointmentCursor | None,
        status: AppointmentStatus | None,
    ) -> list[AppointmentRecord]:
        def operation():
            response = self._client.rpc(
                "list_appointments_cursor_v3",
                {
                    "p_limit": limit,
                    "p_cursor_scheduled_at": cursor.scheduled_at.isoformat() if cursor else None,
                    "p_cursor_id": str(cursor.appointment_id) if cursor else None,
                    "p_status": status.value if status else None,
                },
            )
            return response.execute().data

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
