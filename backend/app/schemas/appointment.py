from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

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


class AppointmentPatchInput(BaseModel):
    scheduled_at: datetime | None = None
    appointment_type: AppointmentType | None = None
    dentist_name: str | None = Field(default=None, min_length=1, max_length=200)
    clinic_name: str | None = Field(default=None, max_length=200)
    clinic_address: str | None = Field(default=None, max_length=500)
    clinic_phone: str | None = Field(default=None, max_length=30)
    notes: str | None = Field(default=None, max_length=1000)
    status: AppointmentStatus | None = None


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
    reminder_sent: bool
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_record(cls, record: AppointmentRecord) -> "AppointmentOutput":
        return cls(**record.__dict__)
