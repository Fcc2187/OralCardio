from datetime import datetime
from uuid import UUID

from app.core.clock import InstantClock, UtcClock
from app.core.exceptions import BusinessRuleViolationError, EntityNotFoundError
from app.domain.appointments import validate_status_transition
from app.domain.enums import AppointmentStatus, AppointmentType
from app.repositories.interfaces import AppointmentRepository
from app.repositories.records import AppointmentRecord
from app.services.interfaces import PostMutationAchievementEvaluator


class AppointmentService:
    def __init__(
        self,
        repository: AppointmentRepository,
        gamification_service: PostMutationAchievementEvaluator,
        clock: InstantClock | None = None,
    ) -> None:
        self._repository = repository
        self._gamification_service = gamification_service
        self._clock = clock or UtcClock()

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
        idempotency_key: str | None = None,
    ) -> AppointmentRecord:
        self._ensure_scheduled_in_future(scheduled_at)
        appointment = self._repository.create(
            user_id,
            scheduled_at,
            appointment_type,
            dentist_name,
            clinic_name,
            clinic_address,
            clinic_phone,
            notes,
            idempotency_key,
        )
        self._gamification_service.evaluate_after_mutation(user_id)
        return appointment

    def get_appointment(self, appointment_id: UUID, user_id: UUID) -> AppointmentRecord:
        appointment = self._repository.get_by_id(appointment_id, user_id)
        if appointment is None:
            raise EntityNotFoundError("Consulta", str(appointment_id))
        return appointment

    def update_appointment(
        self,
        appointment_id: UUID,
        user_id: UUID,
        changes: dict[str, object],
    ) -> AppointmentRecord:
        current = self.get_appointment(appointment_id, user_id)

        scheduled_at = changes.get("scheduled_at")
        if isinstance(scheduled_at, str):
            self._ensure_scheduled_in_future(scheduled_at)

        status = changes.get("status")
        if status is not None:
            validate_status_transition(current.status, AppointmentStatus(str(status)))

        if not changes:
            return current
        return self._repository.update(appointment_id, user_id, current, changes)

    def delete_appointment(self, appointment_id: UUID, user_id: UUID) -> None:
        self._repository.delete(appointment_id, user_id)

    def list_appointments(
        self, user_id: UUID, limit: int, offset: int, status: AppointmentStatus | None
    ) -> list[AppointmentRecord]:
        return self._repository.list_by_user(user_id, limit, offset, status)

    def _ensure_scheduled_in_future(self, scheduled_at: str) -> None:
        value = datetime.fromisoformat(scheduled_at.replace("Z", "+00:00"))
        if value <= self._clock.now():
            raise BusinessRuleViolationError("A consulta deve ser agendada para o futuro")
