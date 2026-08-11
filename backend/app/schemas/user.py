from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.repositories.records import UserRecord


class UserUpdateInput(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=200)
    phone: str | None = Field(default=None, max_length=30)
    avatar_url: str | None = None


class UserOutput(BaseModel):
    id: UUID
    full_name: str
    avatar_url: str | None
    phone: str | None
    date_of_birth: date | None
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_record(cls, record: UserRecord) -> "UserOutput":
        return cls(**record.__dict__)