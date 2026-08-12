from datetime import UTC, datetime
from uuid import UUID

from app.core.exceptions import EntityNotFoundError
from app.domain.enums import CaregiverStatus
from app.repositories.base import SupabaseRepository
from app.repositories.parsing import parse_datetime, parse_required_datetime
from app.repositories.records import CaregiverRecord

_TABLE = "caregivers"


def _to_record(row: dict) -> CaregiverRecord:
    return CaregiverRecord(
        id=UUID(row["id"]),
        patient_id=UUID(row["patient_id"]),
        caregiver_email=row["caregiver_email"],
        caregiver_user_id=UUID(row["caregiver_user_id"]) if row.get("caregiver_user_id") else None,
        status=CaregiverStatus(row["status"]),
        can_view_reports=row["can_view_reports"],
        can_view_appointments=row["can_view_appointments"],
        receive_alerts=row["receive_alerts"],
        invited_at=parse_required_datetime(row["invited_at"]),
        accepted_at=parse_datetime(row.get("accepted_at")),
        revoked_at=parse_datetime(row.get("revoked_at")),
    )


class SupabaseCaregiverRepository(SupabaseRepository):
    def invite(
        self,
        patient_id: UUID,
        caregiver_email: str,
        can_view_reports: bool,
        can_view_appointments: bool,
        receive_alerts: bool,
    ) -> CaregiverRecord:
        payload = {
            "patient_id": str(patient_id),
            "caregiver_email": caregiver_email,
            "can_view_reports": can_view_reports,
            "can_view_appointments": can_view_appointments,
            "receive_alerts": receive_alerts,
        }

        def operation():
            response = self._client.table(_TABLE).insert(payload).execute()
            return response.data

        rows = self._run("Vínculo de cuidador", operation)
        return _to_record(rows[0])

    def list_by_patient(self, patient_id: UUID) -> list[CaregiverRecord]:
        def operation():
            response = (
                self._client.table(_TABLE)
                .select("*")
                .eq("patient_id", str(patient_id))
                .order("invited_at", desc=True)
                .execute()
            )
            return response.data

        rows = self._run("Vínculo de cuidador", operation)
        return [_to_record(row) for row in rows]

    def get_by_id(self, caregiver_link_id: UUID, patient_id: UUID) -> CaregiverRecord | None:
        def operation():
            response = (
                self._client.table(_TABLE)
                .select("*")
                .eq("id", str(caregiver_link_id))
                .eq("patient_id", str(patient_id))
                .maybe_single()
                .execute()
            )
            return self._maybe_single_data(response)

        row = self._run("Vínculo de cuidador", operation)
        return _to_record(row) if row else None

    def update_permissions(
        self, caregiver_link_id: UUID, patient_id: UUID, values: dict
    ) -> CaregiverRecord:
        def operation():
            response = (
                self._client.table(_TABLE)
                .update(values)
                .eq("id", str(caregiver_link_id))
                .eq("patient_id", str(patient_id))
                .execute()
            )
            return response.data

        rows = self._run("Vínculo de cuidador", operation)
        if not rows:
            raise EntityNotFoundError("Vínculo de cuidador", str(caregiver_link_id))
        return _to_record(rows[0])

    def revoke(self, caregiver_link_id: UUID, patient_id: UUID) -> CaregiverRecord:
        payload = {
            "status": CaregiverStatus.REVOKED.value,
            "revoked_at": datetime.now(UTC).isoformat(),
        }

        def operation():
            response = (
                self._client.table(_TABLE)
                .update(payload)
                .eq("id", str(caregiver_link_id))
                .eq("patient_id", str(patient_id))
                .execute()
            )
            return response.data

        rows = self._run("Vínculo de cuidador", operation)
        if not rows:
            raise EntityNotFoundError("Vínculo de cuidador", str(caregiver_link_id))
        return _to_record(rows[0])

    def list_pending_invitations_for_current_user(self) -> list[CaregiverRecord]:
        def operation():
            response = self._client.rpc("list_pending_caregiver_invitations", {}).execute()
            return response.data

        rows = self._run("Convite de cuidador", operation)
        return [_to_record(row) for row in rows]

    def accept_invitation(self, invitation_id: UUID) -> CaregiverRecord:
        def operation():
            response = self._client.rpc(
                "accept_caregiver_invitation", {"p_invitation_id": str(invitation_id)}
            ).execute()
            return response.data

        row = self._run("Convite de cuidador", operation)
        return _to_record(row)

    def list_active_patients_for_current_user(self) -> list[CaregiverRecord]:
        def operation():
            response = (
                self._client.table(_TABLE)
                .select("*")
                .eq("status", CaregiverStatus.ACTIVE.value)
                .execute()
            )
            return response.data

        rows = self._run("Vínculo de cuidador", operation)
        return [_to_record(row) for row in rows]
