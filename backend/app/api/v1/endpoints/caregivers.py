from uuid import UUID

from fastapi import APIRouter, Depends

from app.api.deps import get_caregiver_service, get_user_service
from app.core.security import CurrentUser, get_current_user
from app.schemas.caregiver import (
    CaregiverInviteInput,
    CaregiverOutput,
    CaregiverPermissionsPatchInput,
)
from app.services.caregiver_service import CaregiverService
from app.services.user_service import UserService

router = APIRouter()


@router.post("/caregivers", response_model=CaregiverOutput, status_code=201)
def invite_caregiver(
    payload: CaregiverInviteInput,
    current_user: CurrentUser = Depends(get_current_user),
    service: CaregiverService = Depends(get_caregiver_service),
    user_service: UserService = Depends(get_user_service),
) -> CaregiverOutput:
    patient = user_service.get_profile(current_user.id)
    caregiver = service.invite_caregiver(
        patient_id=current_user.id,
        patient_name=patient.full_name,
        patient_email=current_user.email,
        caregiver_email=payload.caregiver_email,
        can_view_reports=payload.can_view_reports,
        can_view_appointments=payload.can_view_appointments,
        receive_alerts=payload.receive_alerts,
    )
    return CaregiverOutput.from_record(caregiver)


@router.get("/caregivers", response_model=list[CaregiverOutput])
def list_my_caregivers(
    current_user: CurrentUser = Depends(get_current_user),
    service: CaregiverService = Depends(get_caregiver_service),
) -> list[CaregiverOutput]:
    caregivers = service.list_my_caregivers(current_user.id)
    return [CaregiverOutput.from_record(caregiver) for caregiver in caregivers]


@router.patch("/caregivers/{caregiver_id}", response_model=CaregiverOutput)
def update_caregiver_permissions(
    caregiver_id: UUID,
    payload: CaregiverPermissionsPatchInput,
    current_user: CurrentUser = Depends(get_current_user),
    service: CaregiverService = Depends(get_caregiver_service),
) -> CaregiverOutput:
    caregiver = service.update_permissions(
        caregiver_link_id=caregiver_id,
        patient_id=current_user.id,
        can_view_reports=payload.can_view_reports,
        can_view_appointments=payload.can_view_appointments,
        receive_alerts=payload.receive_alerts,
    )
    return CaregiverOutput.from_record(caregiver)


@router.delete("/caregivers/{caregiver_id}", response_model=CaregiverOutput)
def revoke_caregiver(
    caregiver_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    service: CaregiverService = Depends(get_caregiver_service),
) -> CaregiverOutput:
    caregiver = service.revoke(caregiver_id, current_user.id)
    return CaregiverOutput.from_record(caregiver)
