from datetime import UTC, date, datetime, timedelta
from uuid import UUID

from app.repositories.records import AchievementRecord, UserAchievementRecord, UserStatsRecord


class FakeGamificationRepository:
    def __init__(
        self,
        stats: UserStatsRecord,
        achievements: list[AchievementRecord] | None = None,
        business_date: date = date(2026, 8, 17),
    ) -> None:
        self._stats = stats
        self._achievements: dict[UUID, AchievementRecord] = {a.id: a for a in (achievements or [])}
        self._unlocked: dict[UUID, UserAchievementRecord] = {}
        self.business_date = business_date

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
            visible_on=self.business_date + timedelta(days=1),
            reveal_claimed_at=None,
            revealed_at=None,
            achievement=achievement,
        )

    def claim_due_achievement_reveals(self) -> list[AchievementRecord]:
        due = [
            entry
            for entry in self._unlocked.values()
            if entry.visible_on <= self.business_date and entry.revealed_at is None
        ]
        return [entry.achievement for entry in due]

    def acknowledge_achievement_reveals(self, achievement_ids: list[UUID]) -> None:
        now = datetime.now(UTC)
        for achievement_id in achievement_ids:
            entry = self._unlocked.get(achievement_id)
            if entry is not None:
                self._unlocked[achievement_id] = UserAchievementRecord(
                    achievement_id=entry.achievement_id,
                    earned_at=entry.earned_at,
                    visible_on=entry.visible_on,
                    reveal_claimed_at=entry.reveal_claimed_at,
                    revealed_at=entry.revealed_at or now,
                    achievement=entry.achievement,
                )
