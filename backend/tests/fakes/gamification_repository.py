from datetime import UTC, datetime
from uuid import UUID

from app.repositories.records import AchievementRecord, UserAchievementRecord, UserStatsRecord


class FakeGamificationRepository:
    def __init__(
        self, stats: UserStatsRecord, achievements: list[AchievementRecord] | None = None
    ) -> None:
        self._stats = stats
        self._achievements: dict[UUID, AchievementRecord] = {a.id: a for a in (achievements or [])}
        self._unlocked: dict[UUID, UserAchievementRecord] = {}

    def get_stats(self, user_id: UUID) -> UserStatsRecord | None:
        return self._stats if self._stats.user_id == user_id else None

    def list_active_achievements(self) -> list[AchievementRecord]:
        return list(self._achievements.values())

    def list_unlocked_achievements(self, user_id: UUID) -> list[UserAchievementRecord]:
        return list(self._unlocked.values())

    def unlock_achievement(self, achievement_id: UUID) -> None:
        achievement = self._achievements[achievement_id]
        self._unlocked[achievement_id] = UserAchievementRecord(
            achievement_id=achievement_id,
            earned_at=datetime.now(UTC),
            achievement=achievement,
        )
