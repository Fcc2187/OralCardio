from typing import Protocol
from uuid import UUID

from app.domain.enums import BrushingZone
from app.repositories.records import (
    AchievementRecord,
    BrushingSessionRecord,
    EducationModuleRecord,
    FlossingLogRecord,
    HealthProfileRecord,
    ModuleProgressRecord,
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
