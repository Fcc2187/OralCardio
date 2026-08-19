from datetime import datetime
from uuid import UUID

from supabase import Client

from app.domain.enums import AchievementConditionType
from app.repositories.base import SupabaseRepository
from app.repositories.parsing import parse_date, parse_datetime, parse_required_datetime
from app.repositories.records import (
    AchievementRecord,
    ClaimedAchievementEvaluationRecord,
    UserAchievementRecord,
    UserStatsRecord,
)

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
        brushings_on_last_date=row.get("brushings_on_last_date", 0),
        flossings_on_last_date=row.get("flossings_on_last_date", 0),
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
    def __init__(self, client: Client, write_client: Client | None = None) -> None:
        super().__init__(client)
        self._write_client = write_client or client

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
                .select(
                    "achievement_id, earned_at, visible_on, reveal_claimed_at, "
                    "revealed_at, achievements(*)"
                )
                .eq("user_id", str(user_id))
                .execute()
            )
            return response.data

        rows = self._run("Conquista desbloqueada", operation)
        return [
            UserAchievementRecord(
                achievement_id=UUID(row["achievement_id"]),
                earned_at=parse_required_datetime(row["earned_at"]),
                visible_on=parse_date(row.get("visible_on")) or parse_required_datetime(
                    row["earned_at"]
                ).date(),
                reveal_claimed_at=parse_datetime(row.get("reveal_claimed_at")),
                revealed_at=parse_datetime(row.get("revealed_at")),
                achievement=_to_achievement_record(row["achievements"]),
            )
            for row in rows
        ]

    def unlock_achievement(self, user_id: UUID, achievement_id: UUID) -> None:
        def operation():
            self._write_client.rpc(
                "unlock_achievement_for_user",
                {
                    "p_user_id": str(user_id),
                    "p_achievement_id": str(achievement_id),
                },
            ).execute()

        self._run("Conquista", operation)

    def claim_due_achievement_reveals(self) -> list[AchievementRecord]:
        def operation():
            response = self._client.rpc("claim_due_achievement_reveals", {}).execute()
            return response.data

        rows = self._run("Revelação de conquista", operation)
        return [_to_achievement_record(row) for row in rows]

    def acknowledge_achievement_reveals(self, achievement_ids: list[UUID]) -> None:
        if not achievement_ids:
            return

        def operation():
            self._client.rpc(
                "acknowledge_achievement_reveals",
                {"p_achievement_ids": [str(achievement_id) for achievement_id in achievement_ids]},
            ).execute()

        self._run("Revelação de conquista", operation)


class SupabaseAchievementEvaluationDispatchRepository(SupabaseRepository):
    def claim_due_evaluations(
        self, batch_size: int, lease_seconds: int, now: datetime
    ) -> list[ClaimedAchievementEvaluationRecord]:
        def operation():
            response = self._client.rpc(
                "claim_achievement_evaluations",
                {
                    "p_batch_size": batch_size,
                    "p_lease_seconds": lease_seconds,
                    "p_now": now.isoformat(),
                },
            ).execute()
            return response.data

        rows = self._run("Fila de avaliação de conquistas", operation)
        return [
            ClaimedAchievementEvaluationRecord(
                user_id=UUID(row["user_id"]),
                requested_version=row["requested_version"],
                lease_token=UUID(row["lease_token"]),
                attempt_count=row["attempt_count"],
            )
            for row in rows
        ]

    def complete_evaluation(
        self,
        user_id: UUID,
        requested_version: int,
        lease_token: UUID,
        succeeded: bool,
        retry_at: datetime | None,
        error_code: str | None,
    ) -> None:
        def operation():
            self._client.rpc(
                "complete_achievement_evaluation",
                {
                    "p_user_id": str(user_id),
                    "p_requested_version": requested_version,
                    "p_lease_token": str(lease_token),
                    "p_succeeded": succeeded,
                    "p_retry_at": retry_at.isoformat() if retry_at else None,
                    "p_error_code": error_code,
                },
            ).execute()

        self._run("Avaliação de conquista", operation)
