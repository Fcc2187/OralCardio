from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_appointment_service
from app.api.headers import IdempotencyKey
from app.core.pagination import (
    AppointmentCursor,
    decode_appointment_cursor,
    encode_appointment_cursor,
)
from app.core.security import CurrentUser, get_current_user
from app.domain.enums import AppointmentStatus
from app.schemas.appointment import AppointmentInput, AppointmentOutput, AppointmentPatchInput
from app.schemas.common import CursorPage
from app.services.appointment_service import AppointmentService

router = APIRouter()


@router.post("/appointments", response_model=AppointmentOutput, status_code=201)
def create_appointment(
    payload: AppointmentInput,
    idempotency_key: IdempotencyKey,
    current_user: CurrentUser = Depends(get_current_user),
    service: AppointmentService = Depends(get_appointment_service),
) -> AppointmentOutput:
    result = service.create_appointment(
        user_id=current_user.id,
        scheduled_at=payload.scheduled_at.isoformat(),
        appointment_type=payload.appointment_type,
        dentist_name=payload.dentist_name,
        clinic_name=payload.clinic_name,
        clinic_address=payload.clinic_address,
        clinic_phone=payload.clinic_phone,
        notes=payload.notes,
        idempotency_key=idempotency_key,
    )
    return AppointmentOutput.from_record(result)


@router.get("/appointments", response_model=CursorPage[AppointmentOutput])
def list_appointments(
    limit: int = Query(default=20, ge=1, le=100),
    cursor: str | None = Query(default=None, min_length=8, max_length=512),
    status: AppointmentStatus | None = Query(default=None),
    current_user: CurrentUser = Depends(get_current_user),
    service: AppointmentService = Depends(get_appointment_service),
) -> CursorPage[AppointmentOutput]:
    decoded_cursor = decode_appointment_cursor(cursor) if cursor else None
    appointments = service.list_appointments(current_user.id, limit + 1, decoded_cursor, status)
    items = [AppointmentOutput.from_record(appointment) for appointment in appointments]
    visible_items = items[:limit]
    next_cursor = None
    if len(items) > limit:
        last = appointments[limit - 1]
        next_cursor = encode_appointment_cursor(
            AppointmentCursor(scheduled_at=last.scheduled_at, appointment_id=last.id)
        )
    return CursorPage(items=visible_items, limit=limit, next_cursor=next_cursor)


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
    changes = payload.model_dump(exclude_unset=True)
    if "scheduled_at" in changes:
        changes["scheduled_at"] = payload.scheduled_at.isoformat()  # type: ignore[union-attr]
    if "appointment_type" in changes:
        changes["appointment_type"] = payload.appointment_type.value  # type: ignore[union-attr]
    if "status" in changes:
        changes["status"] = payload.status.value  # type: ignore[union-attr]
    appointment = service.update_appointment(appointment_id, current_user.id, changes)
    return AppointmentOutput.from_record(appointment)


@router.delete("/appointments/{appointment_id}", status_code=204)
def delete_appointment(
    appointment_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    service: AppointmentService = Depends(get_appointment_service),
) -> None:
    service.delete_appointment(appointment_id, current_user.id)
