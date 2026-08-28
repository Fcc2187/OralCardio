from uuid import UUID

from app.application.contracts import DashboardSummary
from app.core.clock import BusinessClock
from app.domain.levels import LEVELS, calculate_level
from app.services.appointment_service import AppointmentService
from app.services.education_service import EducationService
from app.services.gamification_service import GamificationService
from app.services.health_profile_service import HealthProfileService
from app.services.user_service import UserService


class DashboardService:
    """Compõe a tela inicial (seção 3.1) reusando os demais services, sem
    duplicar nenhuma regra de negócio já implementada neles.
    """

    def __init__(
        self,
        user_service: UserService,
        health_profile_service: HealthProfileService,
        gamification_service: GamificationService,
        education_service: EducationService,
        appointment_service: AppointmentService,
        clock: BusinessClock,
    ) -> None:
        self._user_service = user_service
        self._health_profile_service = health_profile_service
        self._gamification_service = gamification_service
        self._education_service = education_service
        self._appointment_service = appointment_service
        self._clock = clock

    def get_summary(self, user_id: UUID) -> DashboardSummary:
        user = self._user_service.get_profile(user_id)
        health_profile = self._health_profile_service.get_profile(user_id)
        stats = self._gamification_service.get_stats(user_id)
        modules = self._education_service.list_modules_with_progress(user_id)
        next_appointment = self._appointment_service.get_next_scheduled(user_id)

        today = self._clock.today()
        brushings_today = (
            stats.brushings_on_last_date if stats.last_brushing_date == today else 0
        )
        flossings_today = (
            stats.flossings_on_last_date if stats.last_flossing_date == today else 0
        )
        current_level = calculate_level(stats.total_points)
        next_level = (
            LEVELS[current_level.number] if current_level.number < len(LEVELS) else None
        )

        return DashboardSummary(
            full_name=user.full_name,
            health_profile_completed=bool(health_profile and health_profile.is_completed),
            brushed_today=brushings_today > 0,
            flossed_today=flossings_today > 0,
            brushings_today=brushings_today,
            flossings_today=flossings_today,
            current_streak_days=stats.current_streak_days,
            total_points=stats.total_points,
            level=stats.level,
            level_name=stats.level_name,
            current_level_min_points=current_level.min_points,
            next_level_name=next_level.name if next_level else None,
            next_level_min_points=next_level.min_points if next_level else None,
            completed_education_modules=sum(
                module.progress is not None and module.progress.is_completed
                for module in modules
            ),
            total_education_modules=len(modules),
            next_appointment_at=(
                next_appointment.scheduled_at if next_appointment else None
            ),
        )
