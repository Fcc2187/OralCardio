from datetime import UTC, datetime
from uuid import UUID

from app.core.exceptions import EntityNotFoundError
from app.repositories.base import SupabaseRepository
from app.repositories.parsing import parse_datetime, parse_required_datetime
from app.repositories.records import EducationModuleRecord, ModuleProgressRecord

_MODULES_TABLE = "education_modules"
_PROGRESS_TABLE = "user_module_progress"


def _to_module_record(row: dict) -> EducationModuleRecord:
    return EducationModuleRecord(
        id=UUID(row["id"]),
        title=row["title"],
        slug=row["slug"],
        description=row["description"],
        content=row["content"],
        category=row["category"],
        order_index=row["order_index"],
        estimated_minutes=row["estimated_minutes"],
        thumbnail_url=row.get("thumbnail_url"),
        is_active=row["is_active"],
    )


def _to_progress_record(row: dict) -> ModuleProgressRecord:
    return ModuleProgressRecord(
        id=UUID(row["id"]),
        user_id=UUID(row["user_id"]),
        module_id=UUID(row["module_id"]),
        started_at=parse_required_datetime(row["started_at"]),
        completed_at=parse_datetime(row.get("completed_at")),
        is_completed=row["is_completed"],
        read_time_seconds=row.get("read_time_seconds"),
    )


class SupabaseEducationRepository(SupabaseRepository):
    def list_active_modules(self) -> list[EducationModuleRecord]:
        def operation():
            response = (
                self._client.table(_MODULES_TABLE)
                .select("*")
                .eq("is_active", True)
                .order("order_index")
                .execute()
            )
            return response.data

        rows = self._run("Módulo educacional", operation)
        return [_to_module_record(row) for row in rows]

    def get_module_by_slug(self, slug: str) -> EducationModuleRecord | None:
        def operation():
            response = (
                self._client.table(_MODULES_TABLE)
                .select("*")
                .eq("slug", slug)
                .eq("is_active", True)
                .maybe_single()
                .execute()
            )
            return self._maybe_single_data(response)

        row = self._run("Módulo educacional", operation)
        return _to_module_record(row) if row else None

    def get_module_by_id(self, module_id: UUID) -> EducationModuleRecord | None:
        def operation():
            response = (
                self._client.table(_MODULES_TABLE)
                .select("*")
                .eq("id", str(module_id))
                .maybe_single()
                .execute()
            )
            return self._maybe_single_data(response)

        row = self._run("Módulo educacional", operation)
        return _to_module_record(row) if row else None

    def list_progress_by_user(self, user_id: UUID) -> list[ModuleProgressRecord]:
        def operation():
            response = (
                self._client.table(_PROGRESS_TABLE)
                .select("*")
                .eq("user_id", str(user_id))
                .execute()
            )
            return response.data

        rows = self._run("Progresso de módulo", operation)
        return [_to_progress_record(row) for row in rows]

    def get_progress(self, user_id: UUID, module_id: UUID) -> ModuleProgressRecord | None:
        def operation():
            response = (
                self._client.table(_PROGRESS_TABLE)
                .select("*")
                .eq("user_id", str(user_id))
                .eq("module_id", str(module_id))
                .maybe_single()
                .execute()
            )
            return self._maybe_single_data(response)

        row = self._run("Progresso de módulo", operation)
        return _to_progress_record(row) if row else None

    def start_module(self, user_id: UUID, module_id: UUID) -> ModuleProgressRecord:
        payload = {"user_id": str(user_id), "module_id": str(module_id)}

        def operation():
            response = (
                self._client.table(_PROGRESS_TABLE)
                .upsert(payload, on_conflict="user_id,module_id")
                .execute()
            )
            return response.data

        rows = self._run("Progresso de módulo", operation)
        return _to_progress_record(rows[0])

    def complete_module(
        self, user_id: UUID, module_id: UUID, read_time_seconds: int | None
    ) -> ModuleProgressRecord:
        payload = {
            "is_completed": True,
            "completed_at": datetime.now(UTC).isoformat(),
            "read_time_seconds": read_time_seconds,
        }

        def operation():
            response = (
                self._client.table(_PROGRESS_TABLE)
                .update(payload)
                .eq("user_id", str(user_id))
                .eq("module_id", str(module_id))
                .execute()
            )
            return response.data

        rows = self._run("Progresso de módulo", operation)
        if not rows:
            raise EntityNotFoundError("Progresso de módulo", str(module_id))
        return _to_progress_record(rows[0])