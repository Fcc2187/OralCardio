from uuid import UUID

from app.core.exceptions import EntityNotFoundError
from app.repositories.base import SupabaseRepository
from app.repositories.parsing import parse_date, parse_required_datetime
from app.repositories.records import UserRecord

_TABLE = "users"


def _to_record(row: dict) -> UserRecord:
    return UserRecord(
        id=UUID(row["id"]),
        full_name=row["full_name"],
        avatar_url=row.get("avatar_url"),
        phone=row.get("phone"),
        date_of_birth=parse_date(row.get("date_of_birth")),
        created_at=parse_required_datetime(row["created_at"]),
        updated_at=parse_required_datetime(row["updated_at"]),
    )


class SupabaseUserRepository(SupabaseRepository):
    def get_by_id(self, user_id: UUID) -> UserRecord | None:
        def operation():
            response = (
                self._client.table(_TABLE)
                .select("*")
                .eq("id", str(user_id))
                .maybe_single()
                .execute()
            )
            return self._maybe_single_data(response)

        row = self._run("Usuário", operation)
        return _to_record(row) if row else None

    def update(
        self, user_id: UUID, full_name: str | None, phone: str | None, avatar_url: str | None
    ) -> UserRecord:
        values = {
            key: value
            for key, value in {
                "full_name": full_name,
                "phone": phone,
                "avatar_url": avatar_url,
            }.items()
            if value is not None
        }

        def operation():
            response = (
                self._client.table(_TABLE).update(values).eq("id", str(user_id)).execute()
            )
            return response.data

        rows = self._run("Usuário", operation)
        if not rows:
            raise EntityNotFoundError("Usuário", str(user_id))
        return _to_record(rows[0])

    def list_by_ids(self, user_ids: list[UUID]) -> list[UserRecord]:
        if not user_ids:
            # PostgREST devolve 400 para `in.()` vazio — guard evita a
            # chamada em vez de tratar o erro.
            return []

        def operation():
            response = (
                self._client.table(_TABLE)
                .select("*")
                .in_("id", [str(user_id) for user_id in user_ids])
                .execute()
            )
            return response.data

        rows = self._run("Usuário", operation)
        return [_to_record(row) for row in rows]
