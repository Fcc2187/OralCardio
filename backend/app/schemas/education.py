from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.application.contracts import ModuleWithProgress
from app.domain.enums import EducationCategory


class ModuleCompleteInput(BaseModel):
    read_time_seconds: int | None = Field(default=None, ge=0)


class EducationModuleOutput(BaseModel):
    id: UUID
    title: str
    slug: str
    description: str
    content: dict
    category: EducationCategory
    order_index: int
    estimated_minutes: int
    thumbnail_url: str | None
    is_started: bool
    is_completed: bool
    started_at: datetime | None
    completed_at: datetime | None

    @classmethod
    def from_module_with_progress(cls, entry: ModuleWithProgress) -> "EducationModuleOutput":
        module, progress = entry.module, entry.progress
        return cls(
            id=module.id,
            title=module.title,
            slug=module.slug,
            description=module.description,
            content=module.content,
            category=EducationCategory(module.category),
            order_index=module.order_index,
            estimated_minutes=module.estimated_minutes,
            thumbnail_url=module.thumbnail_url,
            is_started=progress is not None,
            is_completed=progress.is_completed if progress else False,
            started_at=progress.started_at if progress else None,
            completed_at=progress.completed_at if progress else None,
        )
