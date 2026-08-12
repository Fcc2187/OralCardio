from dataclasses import replace
from datetime import UTC, datetime
from uuid import UUID, uuid4

from app.core.exceptions import BusinessRuleViolationError, ConflictError
from app.domain.enums import CaregiverStatus
from app.repositories.records import CaregiverRecord


class FakeCaregiverRepository:
    """Simula, em memória, tanto o CRUD do lado do paciente quanto as RPCs
    `SECURITY DEFINER` do lado do cuidador — por isso recebe explicitamente a
    identidade do "usuário autenticado" atual, que no banco real vem de
    `auth.uid()`/`auth.users.email` dentro da função.
    """

    def __init__(self, current_user_id: UUID, current_user_email: str) -> None:
        self._links: dict[UUID, CaregiverRecord] = {}
        self._current_user_id = current_user_id
        self._current_user_email = current_user_email

    def invite(
        self,
        patient_id: UUID,
        caregiver_email: str,
        can_view_reports: bool,
        can_view_appointments: bool,
        receive_alerts: bool,
    ) -> CaregiverRecord:
        for link in self._links.values():
            if (
                link.patient_id == patient_id
                and link.caregiver_email.lower() == caregiver_email.lower()
            ):
                raise ConflictError("Vínculo de cuidador já existe")

        link_id = uuid4()
        record = CaregiverRecord(
            id=link_id,
            patient_id=patient_id,
            caregiver_email=caregiver_email,
            caregiver_user_id=None,
            status=CaregiverStatus.PENDING,
            can_view_reports=can_view_reports,
            can_view_appointments=can_view_appointments,
            receive_alerts=receive_alerts,
            invited_at=datetime.now(UTC),
            accepted_at=None,
            revoked_at=None,
        )
        self._links[link_id] = record
        return record

    def list_by_patient(self, patient_id: UUID) -> list[CaregiverRecord]:
        return [link for link in self._links.values() if link.patient_id == patient_id]

    def get_by_id(self, caregiver_link_id: UUID, patient_id: UUID) -> CaregiverRecord | None:
        link = self._links.get(caregiver_link_id)
        if link is None or link.patient_id != patient_id:
            return None
        return link

    def update_permissions(
        self, caregiver_link_id: UUID, patient_id: UUID, values: dict
    ) -> CaregiverRecord:
        link = self._links[caregiver_link_id]
        updated = replace(link, **values)
        self._links[caregiver_link_id] = updated
        return updated

    def revoke(self, caregiver_link_id: UUID, patient_id: UUID) -> CaregiverRecord:
        link = self._links[caregiver_link_id]
        updated = replace(link, status=CaregiverStatus.REVOKED, revoked_at=datetime.now(UTC))
        self._links[caregiver_link_id] = updated
        return updated

    def list_pending_invitations_for_current_user(self) -> list[CaregiverRecord]:
        return [
            link
            for link in self._links.values()
            if link.status == CaregiverStatus.PENDING
            and link.caregiver_email.lower() == self._current_user_email.lower()
        ]

    def accept_invitation(self, invitation_id: UUID) -> CaregiverRecord:
        link = self._links.get(invitation_id)
        if (
            link is None
            or link.status != CaregiverStatus.PENDING
            or link.caregiver_email.lower() != self._current_user_email.lower()
        ):
            raise BusinessRuleViolationError(
                "Convite inválido, já utilizado, ou e-mail não corresponde"
            )

        updated = replace(
            link,
            status=CaregiverStatus.ACTIVE,
            accepted_at=datetime.now(UTC),
            caregiver_user_id=self._current_user_id,
        )
        self._links[invitation_id] = updated
        return updated

    def list_active_patients_for_current_user(self) -> list[CaregiverRecord]:
        return [
            link
            for link in self._links.values()
            if link.status == CaregiverStatus.ACTIVE
            and link.caregiver_user_id == self._current_user_id
        ]
