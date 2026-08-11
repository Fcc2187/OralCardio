from dataclasses import replace
from datetime import UTC, datetime
from uuid import UUID, uuid4

from app.repositories.records import EducationModuleRecord, ModuleProgressRecord


class FakeEducationRepository:
    def __init__(self, modules: list[EducationModuleRecord] | None = None) -> None:
        self._modules: dict[UUID, EducationModuleRecord] = {m.id: m for m in (modules or [])}
        self._progress: dict[tuple[UUID, UUID], ModuleProgressRecord] = {}

    def list_active_modules(self) -> list[EducationModuleRecord]:
        return [module for module in self._modules.values() if module.is_active]

    def get_module_by_slug(self, slug: str) -> EducationModuleRecord | None:
        return next(
            (m for m in self._modules.values() if m.slug == slug and m.is_active), None
        )

    def get_module_by_id(self, module_id: UUID) -> EducationModuleRecord | None:
        return self._modules.get(module_id)

    def list_progress_by_user(self, user_id: UUID) -> list[ModuleProgressRecord]:
        return [
            progress
            for (progress_user_id, _), progress in self._progress.items()
            if progress_user_id == user_id
        ]

    def get_progress(self, user_id: UUID, module_id: UUID) -> ModuleProgressRecord | None:
        return self._progress.get((user_id, module_id))

    def start_module(self, user_id: UUID, module_id: UUID) -> ModuleProgressRecord:
        record = ModuleProgressRecord(
            id=uuid4(),
            user_id=user_id,
            module_id=module_id,
            started_at=datetime.now(UTC),
            completed_at=None,
            is_completed=False,
            read_time_seconds=None,
        )
        self._progress[(user_id, module_id)] = record
        return record

    def complete_module(
        self, user_id: UUID, module_id: UUID, read_time_seconds: int | None
    ) -> ModuleProgressRecord:
        record = self._progress[(user_id, module_id)]
        updated = replace(
            record,
            is_completed=True,
            completed_at=datetime.now(UTC),
            read_time_seconds=read_time_seconds,
        )
        self._progress[(user_id, module_id)] = updated
        return updated
