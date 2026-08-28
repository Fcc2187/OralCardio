from datetime import datetime

from pydantic import BaseModel

from app.application.contracts import DashboardSummary


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
    current_level_min_points: int
    next_level_name: str | None
    next_level_min_points: int | None
    completed_education_modules: int
    total_education_modules: int
    next_appointment_at: datetime | None

    @classmethod
    def from_summary(cls, summary: DashboardSummary) -> "DashboardOutput":
        return cls(**summary.__dict__)
