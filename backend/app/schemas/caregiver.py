from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr

from app.domain.enums import CaregiverStatus
from app.repositories.records import CaregiverRecord


class CaregiverInviteInput(BaseModel):
    caregiver_email: EmailStr
    can_view_reports: bool = True
    can_view_appointments: bool = True
    receive_alerts: bool = True


class CaregiverPermissionsPatchInput(BaseModel):
    can_view_reports: bool | None = None
    can_view_appointments: bool | None = None
    receive_alerts: bool | None = None


class CaregiverOutput(BaseModel):
    id: UUID
    patient_id: UUID
    caregiver_email: str
    caregiver_user_id: UUID | None
    status: CaregiverStatus
    can_view_reports: bool
    can_view_appointments: bool
    receive_alerts: bool
    invited_at: datetime
    accepted_at: datetime | None
    revoked_at: datetime | None

    @classmethod
    def from_record(cls, record: CaregiverRecord) -> "CaregiverOutput":
        return cls(**record.__dict__)
