from uuid import UUID

from app.domain.enums import AchievementConditionType
from app.repositories.base import SupabaseRepository
from app.repositories.parsing import parse_date, parse_required_datetime
from app.repositories.records import AchievementRecord, UserAchievementRecord, UserStatsRecord

_STATS_TABLE = "user_stats"
_ACHIEVEMENTS_TABLE = "achievements"
_USER_ACHIEVEMENTS_TABLE = "user_achievements"


def _to_stats_record(row: dict) -> UserStatsRecord:
    return UserStatsRecord(
        user_id=UUID(row["user_id"]),
        total_points=row["total_points"],
        level=row["level"],
        level_name=row["level_name"],
        current_streak_days=row["current_streak_days"],
        longest_streak_days=row["longest_streak_days"],
        total_brushings=row["total_brushings"],
        total_flossings=row["total_flossings"],
        last_brushing_date=parse_date(row.get("last_brushing_date")),
        last_flossing_date=parse_date(row.get("last_flossing_date")),
    )


def _to_achievement_record(row: dict) -> AchievementRecord:
    return AchievementRecord(
        id=UUID(row["id"]),
        name=row["name"],
        description=row["description"],
        icon=row["icon"],
        condition_type=AchievementConditionType(row["condition_type"]),
        condition_value=row["condition_value"],
        points_reward=row["points_reward"],
    )


class SupabaseGamificationRepository(SupabaseRepository):
    def get_stats(self, user_id: UUID) -> UserStatsRecord | None:
        def operation():
            response = (
                self._client.table(_STATS_TABLE)
                .select("*")
                .eq("user_id", str(user_id))
                .maybe_single()
                .execute()
            )
            return self._maybe_single_data(response)

        row = self._run("Estatísticas", operation)
        return _to_stats_record(row) if row else None

    def list_active_achievements(self) -> list[AchievementRecord]:
        def operation():
            response = (
                self._client.table(_ACHIEVEMENTS_TABLE).select("*").eq("is_active", True).execute()
            )
            return response.data

        rows = self._run("Conquista", operation)
        return [_to_achievement_record(row) for row in rows]

    def list_unlocked_achievements(self, user_id: UUID) -> list[UserAchievementRecord]:
        def operation():
            response = (
                self._client.table(_USER_ACHIEVEMENTS_TABLE)
                .select("achievement_id, earned_at, achievements(*)")
                .eq("user_id", str(user_id))
                .execute()
            )
            return response.data

        rows = self._run("Conquista desbloqueada", operation)
        return [
            UserAchievementRecord(
                achievement_id=UUID(row["achievement_id"]),
                earned_at=parse_required_datetime(row["earned_at"]),
                achievement=_to_achievement_record(row["achievements"]),
            )
            for row in rows
        ]

    def unlock_achievement(self, achievement_id: UUID) -> None:
        def operation():
            self._client.rpc(
                "unlock_achievement", {"p_achievement_id": str(achievement_id)}
            ).execute()

        self._run("Conquista", operation)
