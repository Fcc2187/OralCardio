"""Representações internas das linhas do banco, desacopladas dos DTOs da API.

Repositórios devolvem estes registros; services os traduzem para os schemas
de resposta. Isso mantém a forma da tabela livre para evoluir sem forçar
mudanças no contrato público da API.
"""

from dataclasses import dataclass, field
from datetime import date, datetime
from uuid import UUID

from app.domain.enums import (
    AchievementConditionType,
    AppointmentStatus,
    AppointmentType,
    BrushingZone,
    CardiacCondition,
    CaregiverStatus,
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
    reminder_sent: bool
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True)
class CaregiverRecord:
    id: UUID
    patient_id: UUID
    caregiver_email: str
    caregiver_user_id: UUID | None
    status: CaregiverStatus
    can_view_reports: bool
    can_view_appointments: bool
    receive_alerts: bool
    invited_at: datetime
    accepted_at: datetime | None
    revoked_at: datetime | None
