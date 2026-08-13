from datetime import UTC, datetime
from uuid import UUID

from app.core.exceptions import ConflictError, EntityNotFoundError
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
        """Cria o vínculo — ou reativa um vínculo revogado com o mesmo e-mail.

        Insert-first, não select-then-branch: o índice único
        `caregivers_unique_invite` (patient_id, lower(caregiver_email)) é o
        árbitro de conflito, não um `if` em Python. O caminho feliz (primeiro
        convite, o caso dominante) custa um round trip só; um select prévio
        custaria dois sempre, e ainda teria uma corrida real contra o INSERT.
        `caregiver_email` já deve chegar normalizado (lower/trim) — quem
        normaliza é o service, na escrita.
        """
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

        try:
            rows = self._run("Vínculo de cuidador", operation)
            return _to_record(rows[0])
        except ConflictError:
            reactivated = self._reactivate_revoked(
                patient_id,
                caregiver_email,
                can_view_reports,
                can_view_appointments,
                receive_alerts,
            )
            if reactivated is None:
                raise
            return reactivated

    def _reactivate_revoked(
        self,
        patient_id: UUID,
        caregiver_email: str,
        can_view_reports: bool,
        can_view_appointments: bool,
        receive_alerts: bool,
    ) -> CaregiverRecord | None:
        # O UPDATE se auto-protege contra corrida: dois reconvites
        # concorrentes só encontram UMA linha com status='revoked' — o
        # segundo casa zero linhas (o primeiro já mudou o status) e volta
        # `None`, propagando o 409 original, que é verdade naquele instante.
        payload = {
            "status": CaregiverStatus.PENDING.value,
            "caregiver_user_id": None,
            "accepted_at": None,
            "revoked_at": None,
            "invited_at": datetime.now(UTC).isoformat(),
            "can_view_reports": can_view_reports,
            "can_view_appointments": can_view_appointments,
            "receive_alerts": receive_alerts,
        }

        def operation():
            response = (
                self._client.table(_TABLE)
                .update(payload)
                .eq("patient_id", str(patient_id))
                .eq("caregiver_email", caregiver_email)
                .eq("status", CaregiverStatus.REVOKED.value)
                .execute()
            )
            return response.data

        rows = self._run("Vínculo de cuidador", operation)
        return _to_record(rows[0]) if rows else None

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

    def list_active_patients_for_current_user(
        self, caregiver_user_id: UUID
    ) -> list[CaregiverRecord]:
        # `caregivers` tem duas políticas de RLS permissivas em OR
        # (patient_id = auth.uid() OU caregiver_user_id = auth.uid()) — RLS
        # sozinho não filtra "meus pacientes" aqui, porque também libera os
        # vínculos em que o usuário atual é o PACIENTE. O `.eq()` abaixo é o
        # único filtro que restringe ao lado cuidador.
        def operation():
            response = (
                self._client.table(_TABLE)
                .select("*")
                .eq("status", CaregiverStatus.ACTIVE.value)
                .eq("caregiver_user_id", str(caregiver_user_id))
                .execute()
            )
            return response.data

        rows = self._run("Vínculo de cuidador", operation)
        return [_to_record(row) for row in rows]
