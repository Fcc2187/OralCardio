from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.domain.enums import CardiacCondition
from app.repositories.records import HealthProfileRecord


class HealthProfileInput(BaseModel):
    """DTO de entrada do questionário. `is_completed` nunca aparece aqui —
    é derivado no servidor a partir do sucesso desta submissão."""

    cardiac_condition: CardiacCondition
    cardiac_condition_detail: str | None = Field(default=None, max_length=500)
    has_pacemaker: bool
    has_prosthetic_valve: bool
    medications: list[str] = Field(default_factory=list)
    allergies: list[str] = Field(default_factory=list)
    last_dental_visit: date | None = None
    brushing_frequency_before: int | None = Field(default=None, ge=0, le=20)
    dentist_name: str | None = Field(default=None, max_length=200)
    dentist_phone: str | None = Field(default=None, max_length=30)
    cardiologist_name: str | None = Field(default=None, max_length=200)


class HealthProfileOutput(BaseModel):
    id: UUID
    user_id: UUID
    cardiac_condition: CardiacCondition
    cardiac_condition_detail: str | None
    has_pacemaker: bool
    has_prosthetic_valve: bool
    medications: list[str]
    allergies: list[str]
    last_dental_visit: date | None
    brushing_frequency_before: int | None
    dentist_name: str | None
    dentist_phone: str | None
    cardiologist_name: str | None
    is_completed: bool
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_record(cls, record: HealthProfileRecord) -> "HealthProfileOutput":
        return cls(**record.__dict__)
