from dataclasses import dataclass
from datetime import datetime

from app.domain.enums import PushDeliveryOutcome
from app.repositories.records import (
    AchievementRecord,
    EducationModuleRecord,
    ModuleProgressRecord,
)


@dataclass(frozen=True)
class PushSendResult:
    outcome: PushDeliveryOutcome
    error_code: str | None = None


@dataclass(frozen=True)
class ModuleWithProgress:
    module: EducationModuleRecord
    progress: ModuleProgressRecord | None


@dataclass(frozen=True)
class AchievementStatus:
    achievement: AchievementRecord
    unlocked: bool
    earned_at: datetime | None


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


@dataclass(frozen=True)
class DispatchSummary:
    claimed: int
    sent: int
    retried: int
    revoked: int
    dead: int


@dataclass(frozen=True)
class AchievementEvaluationDispatchSummary:
    claimed: int
    succeeded: int
    retried: int


@dataclass(frozen=True)
class BackgroundDispatchSummary:
    notifications: DispatchSummary
    achievement_evaluations: AchievementEvaluationDispatchSummary
