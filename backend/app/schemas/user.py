from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from app.repositories.records import UserRecord


class UserUpdateInput(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=200)
    phone: str | None = Field(default=None, max_length=30)
    avatar_url: str | None = None

    @model_validator(mode="after")
    def reject_null_name(self) -> "UserUpdateInput":
        if "full_name" in self.model_fields_set and self.full_name is None:
            raise ValueError("O nome não pode ser nulo")
        return self


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
