from datetime import UTC, datetime
from types import SimpleNamespace
from uuid import uuid4

from app.domain.enums import AppointmentStatus
from app.repositories.appointment_repository import SupabaseAppointmentRepository


class _RecordingQuery:
    def __init__(self) -> None:
        self.equal_filters: list[tuple[str, str]] = []
        self.greater_than_filters: list[tuple[str, str]] = []
        self.ordered_by: list[str] = []
        self.limit_value: int | None = None

    def select(self, *_args: object) -> "_RecordingQuery":
        return self

    def eq(self, field: str, value: str) -> "_RecordingQuery":
        self.equal_filters.append((field, value))
        return self

    def gt(self, field: str, value: str) -> "_RecordingQuery":
        self.greater_than_filters.append((field, value))
        return self

    def order(self, field: str) -> "_RecordingQuery":
        self.ordered_by.append(field)
        return self

    def limit(self, value: int) -> "_RecordingQuery":
        self.limit_value = value
        return self

    def maybe_single(self) -> "_RecordingQuery":
        return self

    def execute(self) -> SimpleNamespace:
        return SimpleNamespace(data=None)


class _RecordingClient:
    def __init__(self, query: _RecordingQuery) -> None:
        self.query = query

    def table(self, _name: str) -> _RecordingQuery:
        return self.query


def test_next_scheduled_query_is_scoped_and_ordered() -> None:
    user_id = uuid4()
    after = datetime(2026, 8, 28, 12, tzinfo=UTC)
    query = _RecordingQuery()
    repository = SupabaseAppointmentRepository(_RecordingClient(query))  # type: ignore[arg-type]

    result = repository.get_next_scheduled(user_id, after)

    assert result is None
    assert query.equal_filters == [
        ("user_id", str(user_id)),
        ("status", AppointmentStatus.SCHEDULED.value),
    ]
    assert query.greater_than_filters == [("scheduled_at", after.isoformat())]
    assert query.ordered_by == ["scheduled_at"]
    assert query.limit_value == 1
