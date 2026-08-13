from uuid import UUID

from app.core.exceptions import BusinessRuleViolationError, EntityNotFoundError
from app.notifications.email_sender import EmailSender
from app.repositories.interfaces import CaregiverRepository
from app.repositories.records import CaregiverRecord


class CaregiverService:
    def __init__(self, repository: CaregiverRepository, email_sender: EmailSender) -> None:
        self._repository = repository
        self._email_sender = email_sender

    def invite_caregiver(
        self,
        patient_id: UUID,
        patient_name: str,
        patient_email: str | None,
        caregiver_email: str,
        can_view_reports: bool,
        can_view_appointments: bool,
        receive_alerts: bool,
    ) -> CaregiverRecord:
        normalized_caregiver_email = _normalize_email(caregiver_email)
        if patient_email and _normalize_email(patient_email) == normalized_caregiver_email:
            raise BusinessRuleViolationError(
                "Você não pode se convidar como seu próprio cuidador"
            )

        caregiver = self._repository.invite(
            patient_id,
            normalized_caregiver_email,
            can_view_reports,
            can_view_appointments,
            receive_alerts,
        )
        self._email_sender.send_caregiver_invitation(
            to_email=normalized_caregiver_email, patient_name=patient_name
        )
        return caregiver

    def list_my_caregivers(self, patient_id: UUID) -> list[CaregiverRecord]:
        return self._repository.list_by_patient(patient_id)

    def update_permissions(
        self,
        caregiver_link_id: UUID,
        patient_id: UUID,
        can_view_reports: bool | None,
        can_view_appointments: bool | None,
        receive_alerts: bool | None,
    ) -> CaregiverRecord:
        values = {
            key: value
            for key, value in {
                "can_view_reports": can_view_reports,
                "can_view_appointments": can_view_appointments,
                "receive_alerts": receive_alerts,
            }.items()
            if value is not None
        }

        if not values:
            existing = self._repository.get_by_id(caregiver_link_id, patient_id)
            if existing is None:
                raise EntityNotFoundError("Vínculo de cuidador", str(caregiver_link_id))
            return existing

        return self._repository.update_permissions(caregiver_link_id, patient_id, values)

    def revoke(self, caregiver_link_id: UUID, patient_id: UUID) -> CaregiverRecord:
        return self._repository.revoke(caregiver_link_id, patient_id)


def _normalize_email(email: str) -> str:
    return email.strip().lower()
