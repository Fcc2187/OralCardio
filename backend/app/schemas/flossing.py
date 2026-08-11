from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.repositories.records import FlossingLogRecord


class FlossingLogInput(BaseModel):
    notes: str | None = Field(default=None, max_length=500)


class FlossingLogOutput(BaseModel):
    id: UUID
    user_id: UUID
    logged_at: datetime
    notes: str | None

    @classmethod
    def from_record(cls, record: FlossingLogRecord) -> "FlossingLogOutput":
        return cls(**record.__dict__)