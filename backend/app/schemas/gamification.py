from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel

from app.domain.enums import AchievementConditionType
from app.repositories.records import UserStatsRecord
from app.services.gamification_service import AchievementStatus


class UserStatsOutput(BaseModel):
    total_points: int
    level: int
    level_name: str
    current_streak_days: int
    longest_streak_days: int
    total_brushings: int
    total_flossings: int
    last_brushing_date: date | None
    last_flossing_date: date | None

    @classmethod
    def from_record(cls, record: UserStatsRecord) -> "UserStatsOutput":
        return cls(
            total_points=record.total_points,
            level=record.level,
            level_name=record.level_name,
            current_streak_days=record.current_streak_days,
            longest_streak_days=record.longest_streak_days,
            total_brushings=record.total_brushings,
            total_flossings=record.total_flossings,
            last_brushing_date=record.last_brushing_date,
            last_flossing_date=record.last_flossing_date,
        )


class AchievementOutput(BaseModel):
    id: UUID
    name: str
    description: str
    icon: str
    condition_type: AchievementConditionType
    condition_value: int
    points_reward: int
    unlocked: bool
    earned_at: datetime | None

    @classmethod
    def from_status(cls, status: AchievementStatus) -> "AchievementOutput":
        achievement = status.achievement
        return cls(
            id=achievement.id,
            name=achievement.name,
            description=achievement.description,
            icon=achievement.icon,
            condition_type=achievement.condition_type,
            condition_value=achievement.condition_value,
            points_reward=achievement.points_reward,
            unlocked=status.unlocked,
            earned_at=status.earned_at,
        )
