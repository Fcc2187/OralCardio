from dataclasses import dataclass
from uuid import UUID

from app.core.clock import BusinessClock
from app.services.gamification_service import GamificationService
from app.services.health_profile_service import HealthProfileService
from app.services.user_service import UserService


@dataclass(frozen=True)
class DashboardSummary:
    full_name: str
    health_profile_completed: bool
    brushed_today: bool
    flossed_today: bool
    brushings_today: int
    flossings_today: int
    current_streak_days: int
    total_points: int
    level: int
    level_name: str


class DashboardService:
    """Compõe a tela inicial (seção 3.1) reusando os demais services, sem
    duplicar nenhuma regra de negócio já implementada neles.
    """

    def __init__(
        self,
        user_service: UserService,
        health_profile_service: HealthProfileService,
        gamification_service: GamificationService,
        clock: BusinessClock,
    ) -> None:
        self._user_service = user_service
        self._health_profile_service = health_profile_service
        self._gamification_service = gamification_service
        self._clock = clock

    def get_summary(self, user_id: UUID) -> DashboardSummary:
        user = self._user_service.get_profile(user_id)
        health_profile = self._health_profile_service.get_profile(user_id)
        stats = self._gamification_service.get_stats(user_id)

        today = self._clock.today()
        brushings_today = (
            stats.brushings_on_last_date if stats.last_brushing_date == today else 0
        )
        flossings_today = (
            stats.flossings_on_last_date if stats.last_flossing_date == today else 0
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
        )
