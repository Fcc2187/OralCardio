from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.domain.enums import CardiacCondition
from app.repositories.records import HealthProfileRecord


class HealthProfileInput(BaseModel):
    """DTO de entrada do questionário. `is_completed` nunca aparece aqui —
    é derivado no servidor a partir do sucesso desta submissão."""

    cardiac_condition: CardiacCondition
    cardiac_condition_detail: str | None = Field(default=None, max_length=500)
    has_pacemaker: bool
    has_prosthetic_valve: bool
    medications: list[str] = Field(default_factory=list, max_length=50)
    allergies: list[str] = Field(default_factory=list, max_length=50)
    last_dental_visit: date | None = None
    brushing_frequency_before: int | None = Field(default=None, ge=0, le=20)
    dentist_name: str | None = Field(default=None, max_length=200)
    dentist_phone: str | None = Field(default=None, max_length=30)
    cardiologist_name: str | None = Field(default=None, max_length=200)

    @field_validator("medications", "allergies")
    @classmethod
    def normalize_list_items(cls, values: list[str]) -> list[str]:
        normalized = [value.strip() for value in values]
        if any(not value for value in normalized):
            raise ValueError("Os itens da lista não podem ser vazios")
        if any(len(value) > 200 for value in normalized):
            raise ValueError("Cada item da lista deve ter no máximo 200 caracteres")
        if len(set(item.casefold() for item in normalized)) != len(normalized):
            raise ValueError("Os itens da lista não podem se repetir")
        return normalized


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
