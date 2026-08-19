from uuid import UUID

from app.domain.achievements import AchievementSnapshot
from app.repositories.interfaces import (
    AppointmentRepository,
    EducationRepository,
    HealthProfileRepository,
)
from app.repositories.records import UserStatsRecord


class AchievementSnapshotBuilder:
    """Reúne o estado necessário para avaliar conquistas a partir dos
    repositórios de leitura relevantes.

    Separar "montar o retrato do usuário" de "avaliar e persistir" mantém o
    `GamificationService` focado em orquestração, e evita que seu construtor
    cresça a cada novo domínio que passa a alimentar uma conquista.
    """

    def __init__(
        self,
        education_repository: EducationRepository,
        health_profile_repository: HealthProfileRepository,
        appointment_repository: AppointmentRepository,
    ) -> None:
        self._education_repository = education_repository
        self._health_profile_repository = health_profile_repository
        self._appointment_repository = appointment_repository

    def build(self, user_id: UUID, stats: UserStatsRecord) -> AchievementSnapshot:
        active_modules = self._education_repository.list_active_modules()
        progress = self._education_repository.list_progress_by_user(user_id)
        active_module_ids = {module.id for module in active_modules}
        completed_modules_count = sum(
            1
            for entry in progress
            if entry.is_completed and entry.module_id in active_module_ids
        )

        health_profile = self._health_profile_repository.get_by_user_id(user_id)

        return AchievementSnapshot(
            total_brushings=stats.total_brushings,
            current_streak_days=stats.current_streak_days,
            total_flossings=stats.total_flossings,
            completed_modules_count=completed_modules_count,
            total_active_modules=len(active_modules),
            has_completed_health_profile=bool(health_profile and health_profile.is_completed),
            has_scheduled_appointment=self._appointment_repository.has_any(user_id),
        )
