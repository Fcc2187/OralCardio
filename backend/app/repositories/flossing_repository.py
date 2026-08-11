from uuid import UUID

from app.repositories.base import SupabaseRepository
from app.repositories.parsing import parse_required_datetime
from app.repositories.records import FlossingLogRecord

_TABLE = "flossing_logs"


def _to_record(row: dict) -> FlossingLogRecord:
    return FlossingLogRecord(
        id=UUID(row["id"]),
        user_id=UUID(row["user_id"]),
        logged_at=parse_required_datetime(row["logged_at"]),
        notes=row.get("notes"),
    )


class SupabaseFlossingRepository(SupabaseRepository):
    def create(self, user_id: UUID, notes: str | None) -> FlossingLogRecord:
        payload = {"user_id": str(user_id), "notes": notes}

        def operation():
            response = self._client.table(_TABLE).insert(payload).execute()
            return response.data

        rows = self._run("Registro de fio dental", operation)
        return _to_record(rows[0])

    def list_by_user(self, user_id: UUID, limit: int, offset: int) -> list[FlossingLogRecord]:
        def operation():
            response = (
                self._client.table(_TABLE)
                .select("*")
                .eq("user_id", str(user_id))
                .order("logged_at", desc=True)
                .range(offset, offset + limit - 1)
                .execute()
            )
            return response.data

        rows = self._run("Registro de fio dental", operation)
        return [_to_record(row) for row in rows]

    def count(self, user_id: UUID) -> int:
        def operation():
            response = (
                self._client.table(_TABLE)
                .select("id", count="exact")
                .eq("user_id", str(user_id))
                .execute()
            )
            return response.count or 0

        return self._run("Registro de fio dental", operation)
