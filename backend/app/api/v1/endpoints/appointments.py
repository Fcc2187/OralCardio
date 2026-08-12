from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_appointment_service
from app.core.security import CurrentUser, get_current_user
from app.domain.enums import AppointmentStatus
from app.schemas.appointment import AppointmentInput, AppointmentOutput, AppointmentPatchInput
from app.schemas.common import Page
from app.services.appointment_service import AppointmentService

router = APIRouter()


@router.post("/appointments", response_model=AppointmentOutput, status_code=201)
def create_appointment(
    payload: AppointmentInput,
    current_user: CurrentUser = Depends(get_current_user),
    service: AppointmentService = Depends(get_appointment_service),
) -> AppointmentOutput:
    appointment = service.create_appointment(
        user_id=current_user.id,
        scheduled_at=payload.scheduled_at.isoformat(),
        appointment_type=payload.appointment_type,
        dentist_name=payload.dentist_name,
        clinic_name=payload.clinic_name,
        clinic_address=payload.clinic_address,
        clinic_phone=payload.clinic_phone,
        notes=payload.notes,
    )
    return AppointmentOutput.from_record(appointment)


@router.get("/appointments", response_model=Page[AppointmentOutput])
def list_appointments(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    status: AppointmentStatus | None = Query(default=None),
    current_user: CurrentUser = Depends(get_current_user),
    service: AppointmentService = Depends(get_appointment_service),
) -> Page[AppointmentOutput]:
    appointments = service.list_appointments(current_user.id, limit, offset, status)
    items = [AppointmentOutput.from_record(appointment) for appointment in appointments]
    return Page.of(items, limit, offset)


@router.get("/appointments/{appointment_id}", response_model=AppointmentOutput)
def get_appointment(
    appointment_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    service: AppointmentService = Depends(get_appointment_service),
) -> AppointmentOutput:
    appointment = service.get_appointment(appointment_id, current_user.id)
    return AppointmentOutput.from_record(appointment)


@router.patch("/appointments/{appointment_id}", response_model=AppointmentOutput)
def update_appointment(
    appointment_id: UUID,
    payload: AppointmentPatchInput,
    current_user: CurrentUser = Depends(get_current_user),
    service: AppointmentService = Depends(get_appointment_service),
) -> AppointmentOutput:
    appointment = service.update_appointment(
        appointment_id=appointment_id,
        user_id=current_user.id,
        scheduled_at=payload.scheduled_at.isoformat() if payload.scheduled_at else None,
        appointment_type=payload.appointment_type,
        dentist_name=payload.dentist_name,
        clinic_name=payload.clinic_name,
        clinic_address=payload.clinic_address,
        clinic_phone=payload.clinic_phone,
        notes=payload.notes,
        status=payload.status,
    )
    return AppointmentOutput.from_record(appointment)


@router.delete("/appointments/{appointment_id}", status_code=204)
def delete_appointment(
    appointment_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    service: AppointmentService = Depends(get_appointment_service),
) -> None:
    service.delete_appointment(appointment_id, current_user.id)
