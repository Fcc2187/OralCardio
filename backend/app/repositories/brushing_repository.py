from uuid import UUID

from app.core.exceptions import EntityNotFoundError
from app.core.idempotency import request_fingerprint
from app.domain.enums import BrushingZone
from app.repositories.base import SupabaseRepository
from app.repositories.parsing import parse_datetime, parse_required_datetime
from app.repositories.records import BrushingSessionRecord

_TABLE = "brushing_sessions"


def _to_record(row: dict) -> BrushingSessionRecord:
    return BrushingSessionRecord(
        id=UUID(row["id"]),
        user_id=UUID(row["user_id"]),
        started_at=parse_required_datetime(row["started_at"]),
        completed_at=parse_datetime(row.get("completed_at")),
        duration_seconds=row.get("duration_seconds"),
        target_duration=row["target_duration"],
        zones_completed=[BrushingZone(zone) for zone in (row.get("zones_completed") or [])],
        is_completed=row["is_completed"],
        technique_tip_shown=row.get("technique_tip_shown"),
        notes=row.get("notes"),
    )


class SupabaseBrushingRepository(SupabaseRepository):
    def create(
        self, user_id: UUID, target_duration: int, idempotency_key: str | None
    ) -> BrushingSessionRecord:
        def operation():
            response = self._client.rpc(
                "create_brushing_session_v2",
                {
                    "p_target_duration": target_duration,
                    "p_idempotency_key": idempotency_key,
                    "p_request_hash": request_fingerprint(
                        {"target_duration": target_duration}
                    ),
                },
            ).execute()
            return response.data

        rows = self._run("Sessão de escovação", operation)
        return _to_record(rows[0])

    def get_by_id(self, session_id: UUID, user_id: UUID) -> BrushingSessionRecord | None:
        def operation():
            response = (
                self._client.table(_TABLE)
                .select("*")
                .eq("id", str(session_id))
                .eq("user_id", str(user_id))
                .maybe_single()
                .execute()
            )
            return self._maybe_single_data(response)

        row = self._run("Sessão de escovação", operation)
        return _to_record(row) if row else None

    def update_zones(
        self, session_id: UUID, user_id: UUID, zone: BrushingZone
    ) -> BrushingSessionRecord:
        def operation():
            response = self._client.rpc(
                "mark_brushing_zone_completed",
                {"p_session_id": str(session_id), "p_zone": zone.value},
            ).execute()
            return response.data

        rows = self._run("Sessão de escovação", operation)
        if not rows:
            raise EntityNotFoundError("Sessão de escovação", str(session_id))
        return _to_record(rows[0])

    def complete(
        self, session_id: UUID, user_id: UUID
    ) -> BrushingSessionRecord:
        def operation():
            response = self._client.rpc(
                "complete_brushing_session", {"p_session_id": str(session_id)}
            ).execute()
            return response.data

        rows = self._run("Sessão de escovação", operation)
        if not rows:
            raise EntityNotFoundError("Sessão de escovação", str(session_id))
        return _to_record(rows[0])

    def list_by_user(
        self, user_id: UUID, limit: int, offset: int
    ) -> list[BrushingSessionRecord]:
        def operation():
            response = (
                self._client.table(_TABLE)
                .select("*")
                .eq("user_id", str(user_id))
                .order("started_at", desc=True)
                .order("id", desc=True)
                .range(offset, offset + limit - 1)
                .execute()
            )
            return response.data

        rows = self._run("Sessão de escovação", operation)
        return [_to_record(row) for row in rows]

    def count_completed(self, user_id: UUID) -> int:
        def operation():
            response = (
                self._client.table(_TABLE)
                .select("id", count="exact")
                .eq("user_id", str(user_id))
                .eq("is_completed", True)
                .execute()
            )
            return response.count or 0

        return self._run("Sessão de escovação", operation)
