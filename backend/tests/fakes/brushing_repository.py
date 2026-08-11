from dataclasses import replace
from datetime import UTC, datetime
from uuid import UUID, uuid4

from app.domain.enums import BrushingZone
from app.repositories.records import BrushingSessionRecord


class FakeBrushingRepository:
    def __init__(self) -> None:
        self._sessions: dict[UUID, BrushingSessionRecord] = {}

    def create(self, user_id: UUID, target_duration: int) -> BrushingSessionRecord:
        session_id = uuid4()
        record = BrushingSessionRecord(
            id=session_id,
            user_id=user_id,
            started_at=datetime.now(UTC),
            completed_at=None,
            duration_seconds=None,
            target_duration=target_duration,
            zones_completed=[],
            is_completed=False,
            technique_tip_shown=None,
            notes=None,
        )
        self._sessions[session_id] = record
        return record

    def get_by_id(self, session_id: UUID, user_id: UUID) -> BrushingSessionRecord | None:
        record = self._sessions.get(session_id)
        if record is None or record.user_id != user_id:
            return None
        return record

    def update_zones(
        self, session_id: UUID, user_id: UUID, zones_completed: list[BrushingZone]
    ) -> BrushingSessionRecord:
        record = self._sessions[session_id]
        updated = replace(record, zones_completed=zones_completed)
        self._sessions[session_id] = updated
        return updated

    def complete(
        self, session_id: UUID, user_id: UUID, duration_seconds: int
    ) -> BrushingSessionRecord:
        record = self._sessions[session_id]
        updated = replace(
            record,
            is_completed=True,
            duration_seconds=duration_seconds,
            completed_at=datetime.now(UTC),
        )
        self._sessions[session_id] = updated
        return updated

    def list_by_user(
        self, user_id: UUID, limit: int, offset: int
    ) -> list[BrushingSessionRecord]:
        items = [s for s in self._sessions.values() if s.user_id == user_id]
        items.sort(key=lambda s: s.started_at, reverse=True)
        return items[offset : offset + limit]

    def count_completed(self, user_id: UUID) -> int:
        return sum(1 for s in self._sessions.values() if s.user_id == user_id and s.is_completed)
