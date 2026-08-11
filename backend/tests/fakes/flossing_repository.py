from datetime import UTC, datetime
from uuid import UUID, uuid4

from app.repositories.records import FlossingLogRecord


class FakeFlossingRepository:
    def __init__(self) -> None:
        self._logs: dict[UUID, FlossingLogRecord] = {}

    def create(self, user_id: UUID, notes: str | None) -> FlossingLogRecord:
        log_id = uuid4()
        record = FlossingLogRecord(
            id=log_id, user_id=user_id, logged_at=datetime.now(UTC), notes=notes
        )
        self._logs[log_id] = record
        return record

    def list_by_user(self, user_id: UUID, limit: int, offset: int) -> list[FlossingLogRecord]:
        items = [log for log in self._logs.values() if log.user_id == user_id]
        items.sort(key=lambda log: log.logged_at, reverse=True)
        return items[offset : offset + limit]

    def count(self, user_id: UUID) -> int:
        return sum(1 for log in self._logs.values() if log.user_id == user_id)
