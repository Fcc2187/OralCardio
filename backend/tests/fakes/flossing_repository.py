from datetime import UTC, datetime
from uuid import UUID, uuid4

from app.repositories.records import FlossingLogRecord


class FakeFlossingRepository:
    def __init__(self) -> None:
        self._logs: dict[UUID, FlossingLogRecord] = {}
        self._idempotency_keys: dict[tuple[UUID, str], UUID] = {}

    def create(
        self, user_id: UUID, notes: str | None, idempotency_key: str | None = None
    ) -> FlossingLogRecord:
        if idempotency_key is not None:
            existing_id = self._idempotency_keys.get((user_id, idempotency_key))
            if existing_id is not None:
                return self._logs[existing_id]
        log_id = uuid4()
        record = FlossingLogRecord(
            id=log_id, user_id=user_id, logged_at=datetime.now(UTC), notes=notes
        )
        self._logs[log_id] = record
        if idempotency_key is not None:
            self._idempotency_keys[(user_id, idempotency_key)] = log_id
        return record

    def list_by_user(self, user_id: UUID, limit: int, offset: int) -> list[FlossingLogRecord]:
        items = [log for log in self._logs.values() if log.user_id == user_id]
        items.sort(key=lambda log: log.logged_at, reverse=True)
        return items[offset : offset + limit]

    def count(self, user_id: UUID) -> int:
        return sum(1 for log in self._logs.values() if log.user_id == user_id)
