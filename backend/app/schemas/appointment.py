from datetime import UTC, datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

from app.domain.enums import AppointmentStatus, AppointmentType
from app.repositories.records import AppointmentRecord


class AppointmentInput(BaseModel):
    scheduled_at: datetime
    appointment_type: AppointmentType
    dentist_name: str = Field(min_length=1, max_length=200)
    clinic_name: str | None = Field(default=None, max_length=200)
    clinic_address: str | None = Field(default=None, max_length=500)
    clinic_phone: str | None = Field(default=None, max_length=30)
    notes: str | None = Field(default=None, max_length=1000)

    @field_validator("scheduled_at")
    @classmethod
    def normalize_scheduled_at(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("O horário da consulta deve incluir o fuso horário")
        return value.astimezone(UTC)


class AppointmentPatchInput(BaseModel):
    scheduled_at: datetime | None = None
    appointment_type: AppointmentType | None = None
    dentist_name: str | None = Field(default=None, min_length=1, max_length=200)
    clinic_name: str | None = Field(default=None, max_length=200)
    clinic_address: str | None = Field(default=None, max_length=500)
    clinic_phone: str | None = Field(default=None, max_length=30)
    notes: str | None = Field(default=None, max_length=1000)
    status: AppointmentStatus | None = None

    @field_validator("scheduled_at")
    @classmethod
    def normalize_scheduled_at(cls, value: datetime | None) -> datetime | None:
        if value is not None and (value.tzinfo is None or value.utcoffset() is None):
            raise ValueError("O horário da consulta deve incluir o fuso horário")
        return value.astimezone(UTC) if value is not None else None

    @model_validator(mode="after")
    def reject_null_for_required_fields(self) -> "AppointmentPatchInput":
        for field_name in ("scheduled_at", "appointment_type", "dentist_name", "status"):
            if field_name in self.model_fields_set and getattr(self, field_name) is None:
                raise ValueError(f"O campo `{field_name}` não pode ser nulo")
        return self


class AppointmentOutput(BaseModel):
    id: UUID
    user_id: UUID
    scheduled_at: datetime
    appointment_type: AppointmentType
    dentist_name: str
    clinic_name: str | None
    clinic_address: str | None
    clinic_phone: str | None
    notes: str | None
    status: AppointmentStatus
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_record(cls, record: AppointmentRecord) -> "AppointmentOutput":
        return cls(**record.__dict__)
