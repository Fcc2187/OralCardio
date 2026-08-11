from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, model_validator

from app.domain.enums import BrushingZone
from app.repositories.records import BrushingSessionRecord


class BrushingSessionPatchInput(BaseModel):
    """Corpo do PATCH: informe `zone` para marcar uma zona concluída, ou
    `complete=True` para finalizar a sessão. Exatamente um dos dois."""

    zone: BrushingZone | None = None
    complete: bool = False

    @model_validator(mode="after")
    def validate_exactly_one_action(self) -> "BrushingSessionPatchInput":
        if (self.zone is None) == (not self.complete):
            raise ValueError("Informe exatamente um entre `zone` e `complete=true`")
        return self


class BrushingSessionOutput(BaseModel):
    id: UUID
    user_id: UUID
    started_at: datetime
    completed_at: datetime | None
    duration_seconds: int | None
    target_duration: int
    zones_completed: list[BrushingZone]
    is_completed: bool
    technique_tip_shown: str | None
    notes: str | None

    @classmethod
    def from_record(cls, record: BrushingSessionRecord) -> "BrushingSessionOutput":
        return cls(**record.__dict__)
