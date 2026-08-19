from datetime import datetime
from typing import Protocol
from uuid import UUID

from app.domain.enums import AppointmentStatus, AppointmentType, BrushingZone
from app.repositories.records import (
    AchievementRecord,
    AppointmentRecord,
    BrushingSessionRecord,
    ClaimedNotificationDeliveryRecord,
    EducationModuleRecord,
    FlossingLogRecord,
    HealthProfileRecord,
    ModuleProgressRecord,
    NotificationPreferencesRecord,
    PushSubscriptionRecord,
    UserAchievementRecord,
    UserRecord,
    UserStatsRecord,
)


class HealthRepository(Protocol):
    """Contrato para verificação de disponibilidade da fonte de dados."""

    def ping(self) -> bool:
        """Retorna True se a conexão com o banco de dados está saudável."""
        ...


class UserRepository(Protocol):
    def get_by_id(self, user_id: UUID) -> UserRecord | None: ...

    def update(
        self, user_id: UUID, full_name: str | None, phone: str | None, avatar_url: str | None
    ) -> UserRecord: ...

    def list_by_ids(self, user_ids: list[UUID]) -> list[UserRecord]: ...


class HealthProfileRepository(Protocol):
    def get_by_user_id(self, user_id: UUID) -> HealthProfileRecord | None: ...

    def upsert(self, user_id: UUID, values: dict) -> HealthProfileRecord: ...


class BrushingRepository(Protocol):
    def create(self, user_id: UUID, target_duration: int) -> BrushingSessionRecord: ...

    def get_by_id(self, session_id: UUID, user_id: UUID) -> BrushingSessionRecord | None: ...

    def update_zones(
        self, session_id: UUID, user_id: UUID, zones_completed: list[BrushingZone]
    ) -> BrushingSessionRecord: ...

    def complete(
        self, session_id: UUID, user_id: UUID, duration_seconds: int
    ) -> BrushingSessionRecord: ...

    def list_by_user(
        self, user_id: UUID, limit: int, offset: int
    ) -> list[BrushingSessionRecord]: ...

    def count_completed(self, user_id: UUID) -> int: ...


class FlossingRepository(Protocol):
    def create(self, user_id: UUID, notes: str | None) -> FlossingLogRecord: ...

    def list_by_user(self, user_id: UUID, limit: int, offset: int) -> list[FlossingLogRecord]: ...

    def count(self, user_id: UUID) -> int: ...


class EducationRepository(Protocol):
    def list_active_modules(self) -> list[EducationModuleRecord]: ...

    def get_module_by_slug(self, slug: str) -> EducationModuleRecord | None: ...

    def get_module_by_id(self, module_id: UUID) -> EducationModuleRecord | None: ...

    def list_progress_by_user(self, user_id: UUID) -> list[ModuleProgressRecord]: ...

    def get_progress(self, user_id: UUID, module_id: UUID) -> ModuleProgressRecord | None: ...

    def start_module(self, user_id: UUID, module_id: UUID) -> ModuleProgressRecord: ...

    def complete_module(
        self, user_id: UUID, module_id: UUID, read_time_seconds: int | None
    ) -> ModuleProgressRecord: ...


class GamificationRepository(Protocol):
    def get_stats(self, user_id: UUID) -> UserStatsRecord | None: ...

    def list_active_achievements(self) -> list[AchievementRecord]: ...

    def list_unlocked_achievements(self, user_id: UUID) -> list[UserAchievementRecord]: ...

    def unlock_achievement(self, achievement_id: UUID) -> None: ...

    def claim_due_achievement_reveals(self) -> list[AchievementRecord]: ...

    def acknowledge_achievement_reveals(self, achievement_ids: list[UUID]) -> None: ...


class AppointmentRepository(Protocol):
    def create(
        self,
        user_id: UUID,
        scheduled_at: str,
        appointment_type: AppointmentType,
        dentist_name: str,
        clinic_name: str | None,
        clinic_address: str | None,
        clinic_phone: str | None,
        notes: str | None,
    ) -> AppointmentRecord: ...

    def get_by_id(self, appointment_id: UUID, user_id: UUID) -> AppointmentRecord | None: ...

    def update(self, appointment_id: UUID, user_id: UUID, values: dict) -> AppointmentRecord: ...

    def delete(self, appointment_id: UUID, user_id: UUID) -> None: ...

    def list_by_user(
        self,
        user_id: UUID,
        limit: int,
        offset: int,
        status: AppointmentStatus | None,
    ) -> list[AppointmentRecord]: ...

    def has_any(self, user_id: UUID) -> bool: ...


class NotificationRepository(Protocol):
    def get_preferences(self, user_id: UUID) -> NotificationPreferencesRecord: ...

    def update_preferences(
        self,
        user_id: UUID,
        *,
        enabled: bool,
        brushing_enabled: bool,
        brushing_times: tuple[str, ...],
        flossing_enabled: bool,
        flossing_time: str,
        appointments_enabled: bool,
        appointment_lead_minutes: tuple[int, ...],
        quiet_hours_start: str,
        quiet_hours_end: str,
    ) -> NotificationPreferencesRecord: ...

    def upsert_subscription(
        self,
        *,
        endpoint: str,
        p256dh: str,
        auth_secret: str,
        expiration_time: datetime | None,
        device_label: str | None,
        vapid_key_version: int,
    ) -> PushSubscriptionRecord: ...

    def unsubscribe(self, endpoint: str) -> bool: ...

    def request_test_notification(self) -> UUID: ...


class NotificationDispatchRepository(Protocol):
    def claim_due_deliveries(
        self, batch_size: int, lease_seconds: int, now: datetime
    ) -> list[ClaimedNotificationDeliveryRecord]: ...

    def complete_delivery(
        self,
        delivery_id: UUID,
        outcome: str,
        error_code: str | None,
        retry_at: datetime | None,
    ) -> None: ...
