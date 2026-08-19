"""Representações internas das linhas do banco, desacopladas dos DTOs da API.

Repositórios devolvem estes registros; services os traduzem para os schemas
de resposta. Isso mantém a forma da tabela livre para evoluir sem forçar
mudanças no contrato público da API.
"""

from dataclasses import dataclass, field
from datetime import date, datetime, time
from uuid import UUID

from app.domain.enums import (
    AchievementConditionType,
    AppointmentStatus,
    AppointmentType,
    BrushingZone,
    CardiacCondition,
    HabitNotificationType,
    NotificationType,
)


@dataclass(frozen=True)
class UserRecord:
    id: UUID
    full_name: str
    avatar_url: str | None
    phone: str | None
    date_of_birth: date | None
    created_at: datetime
    updated_at: datetime

@dataclass(frozen=True)
class HealthProfileRecord:
    id: UUID
    user_id: UUID
    cardiac_condition: CardiacCondition
    cardiac_condition_detail: str | None
    has_pacemaker: bool
    has_prosthetic_valve: bool
    medications: list[str]
    allergies: list[str]
    last_dental_visit: date | None
    brushing_frequency_before: int | None
    dentist_name: str | None
    dentist_phone: str | None
    cardiologist_name: str | None
    is_completed: bool
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True)
class BrushingSessionRecord:
    id: UUID
    user_id: UUID
    started_at: datetime
    completed_at: datetime | None
    duration_seconds: int | None
    target_duration: int
    zones_completed: list[BrushingZone]
    is_completed: bool
    technique_tip_shown: str | None
    notes: str | None


@dataclass(frozen=True)
class FlossingLogRecord:
    id: UUID
    user_id: UUID
    logged_at: datetime
    notes: str | None


@dataclass(frozen=True)
class EducationModuleRecord:
    id: UUID
    title: str
    slug: str
    description: str
    content: dict
    category: str
    order_index: int
    estimated_minutes: int
    thumbnail_url: str | None
    is_active: bool


@dataclass(frozen=True)
class ModuleProgressRecord:
    id: UUID
    user_id: UUID
    module_id: UUID
    started_at: datetime
    completed_at: datetime | None
    is_completed: bool
    read_time_seconds: int | None


@dataclass(frozen=True)
class UserStatsRecord:
    user_id: UUID
    total_points: int
    level: int
    level_name: str
    current_streak_days: int
    longest_streak_days: int
    total_brushings: int
    total_flossings: int
    last_brushing_date: date | None
    last_flossing_date: date | None
    brushings_on_last_date: int = 0
    flossings_on_last_date: int = 0


@dataclass(frozen=True)
class AchievementRecord:
    id: UUID
    name: str
    description: str
    icon: str
    condition_type: AchievementConditionType
    condition_value: int
    points_reward: int


@dataclass(frozen=True)
class UserAchievementRecord:
    achievement_id: UUID
    earned_at: datetime
    visible_on: date
    reveal_claimed_at: datetime | None
    revealed_at: datetime | None
    achievement: AchievementRecord = field(repr=False)


@dataclass(frozen=True)
class AppointmentRecord:
    id: UUID
    user_id: UUID
    scheduled_at: datetime
    appointment_type: AppointmentType
    dentist_name: str
    clinic_name: str | None
    clinic_address: str | None
    clinic_phone: str | None
    notes: str | None
    status: AppointmentStatus
    created_at: datetime
    updated_at: datetime
    version: int = 1


@dataclass(frozen=True)
class HabitNotificationScheduleRecord:
    id: UUID
    habit_type: HabitNotificationType
    local_time: time
    target_ordinal: int
    enabled: bool
    next_due_at: datetime


@dataclass(frozen=True)
class NotificationPreferencesRecord:
    id: UUID
    user_id: UUID
    enabled: bool
    brushing_enabled: bool
    brushing_times: tuple[time, ...]
    flossing_enabled: bool
    flossing_time: time
    appointments_enabled: bool
    appointment_lead_minutes: tuple[int, ...]
    quiet_hours_start: time
    quiet_hours_end: time
    consented_at: datetime | None
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True)
class PushSubscriptionRecord:
    id: UUID
    active: bool


@dataclass(frozen=True)
class ClaimedNotificationDeliveryRecord:
    delivery_id: UUID
    job_id: UUID
    notification_type: NotificationType
    endpoint: str
    p256dh: str
    auth_secret: str
    payload: dict
    attempt_count: int
    lease_token: UUID


@dataclass(frozen=True)
class ClaimedAchievementEvaluationRecord:
    user_id: UUID
    requested_version: int
    lease_token: UUID
    attempt_count: int
