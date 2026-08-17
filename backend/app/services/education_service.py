from dataclasses import dataclass
from uuid import UUID

from app.core.exceptions import EntityNotFoundError
from app.repositories.interfaces import EducationRepository
from app.repositories.records import EducationModuleRecord, ModuleProgressRecord
from app.services.gamification_service import GamificationService


@dataclass(frozen=True)
class ModuleWithProgress:
    module: EducationModuleRecord
    progress: ModuleProgressRecord | None


class EducationService:
    def __init__(
        self, repository: EducationRepository, gamification_service: GamificationService
    ) -> None:
        self._repository = repository
        self._gamification_service = gamification_service

    def list_modules_with_progress(self, user_id: UUID) -> list[ModuleWithProgress]:
        modules = self._repository.list_active_modules()
        progress_by_module_id = {
            entry.module_id: entry for entry in self._repository.list_progress_by_user(user_id)
        }
        return [
            ModuleWithProgress(module=module, progress=progress_by_module_id.get(module.id))
            for module in modules
        ]

    def get_module_by_slug(self, user_id: UUID, slug: str) -> ModuleWithProgress:
        module = self._repository.get_module_by_slug(slug)
        if module is None:
            raise EntityNotFoundError("Módulo educacional", slug)
        progress = self._repository.get_progress(user_id, module.id)
        return ModuleWithProgress(module=module, progress=progress)

    def start_module(self, user_id: UUID, module_id: UUID) -> ModuleWithProgress:
        module = self._get_active_module(module_id)

        existing = self._repository.get_progress(user_id, module_id)
        progress = existing or self._repository.start_module(user_id, module_id)
        return ModuleWithProgress(module=module, progress=progress)

    def complete_module(
        self, user_id: UUID, module_id: UUID, read_time_seconds: int | None
    ) -> ModuleWithProgress:
        module = self._get_active_module(module_id)

        existing = self._repository.get_progress(user_id, module_id)
        if existing is not None and existing.is_completed:
            return ModuleWithProgress(module=module, progress=existing)

        if existing is None:
            self._repository.start_module(user_id, module_id)

        progress = self._repository.complete_module(user_id, module_id, read_time_seconds)
        self._gamification_service.evaluate_and_unlock(user_id)
        return ModuleWithProgress(module=module, progress=progress)

    def _get_active_module(self, module_id: UUID) -> EducationModuleRecord:
        module = self._repository.get_module_by_id(module_id)
        if module is None or not module.is_active:
            raise EntityNotFoundError("Módulo educacional", str(module_id))
        return module
