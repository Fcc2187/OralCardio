from pydantic import BaseModel

from app.services.dashboard_service import DashboardSummary


class DashboardOutput(BaseModel):
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

    @classmethod
    def from_summary(cls, summary: DashboardSummary) -> "DashboardOutput":
        return cls(**summary.__dict__)
