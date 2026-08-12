from uuid import UUID

from app.core.exceptions import EntityNotFoundError
from app.domain.appointments import validate_status_transition
from app.domain.enums import AppointmentStatus, AppointmentType
from app.repositories.interfaces import AppointmentRepository
from app.repositories.records import AppointmentRecord
from app.services.gamification_service import GamificationService, GamifiedResult


class AppointmentService:
    def __init__(
        self, repository: AppointmentRepository, gamification_service: GamificationService
    ) -> None:
        self._repository = repository
        self._gamification_service = gamification_service

    def create_appointment(
        self,
        user_id: UUID,
        scheduled_at: str,
        appointment_type: AppointmentType,
        dentist_name: str,
        clinic_name: str | None,
        clinic_address: str | None,
        clinic_phone: str | None,
        notes: str | None,
    ) -> GamifiedResult[AppointmentRecord]:
        appointment = self._repository.create(
            user_id,
            scheduled_at,
            appointment_type,
            dentist_name,
            clinic_name,
            clinic_address,
            clinic_phone,
            notes,
        )
        unlocked = self._gamification_service.evaluate_and_unlock(user_id)
        return GamifiedResult(value=appointment, unlocked_achievements=unlocked)

    def get_appointment(self, appointment_id: UUID, user_id: UUID) -> AppointmentRecord:
        appointment = self._repository.get_by_id(appointment_id, user_id)
        if appointment is None:
            raise EntityNotFoundError("Consulta", str(appointment_id))
        return appointment

    def update_appointment(
        self,
        appointment_id: UUID,
        user_id: UUID,
        scheduled_at: str | None,
        appointment_type: AppointmentType | None,
        dentist_name: str | None,
        clinic_name: str | None,
        clinic_address: str | None,
        clinic_phone: str | None,
        notes: str | None,
        status: AppointmentStatus | None,
    ) -> AppointmentRecord:
        current = self.get_appointment(appointment_id, user_id)

        if status is not None:
            validate_status_transition(current.status, status)

        values = {
            key: value
            for key, value in {
                "scheduled_at": scheduled_at,
                "appointment_type": appointment_type.value if appointment_type else None,
                "dentist_name": dentist_name,
                "clinic_name": clinic_name,
                "clinic_address": clinic_address,
                "clinic_phone": clinic_phone,
                "notes": notes,
                "status": status.value if status else None,
            }.items()
            if value is not None
        }

        if not values:
            return current

        return self._repository.update(appointment_id, user_id, values)

    def delete_appointment(self, appointment_id: UUID, user_id: UUID) -> None:
        self._repository.delete(appointment_id, user_id)

    def list_appointments(
        self, user_id: UUID, limit: int, offset: int, status: AppointmentStatus | None
    ) -> list[AppointmentRecord]:
        return self._repository.list_by_user(user_id, limit, offset, status)
