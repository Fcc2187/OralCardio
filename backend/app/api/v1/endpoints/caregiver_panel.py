from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.api.deps import get_caregiver_panel_service, get_caregiver_service
from app.core.security import CurrentUser, get_current_user
from app.domain.enums import AppointmentStatus
from app.schemas.appointment import AppointmentOutput
from app.schemas.brushing import BrushingSessionOutput
from app.schemas.caregiver import CaregiverOutput
from app.schemas.common import Page
from app.schemas.gamification import UserStatsOutput
from app.services.caregiver_panel_service import CaregiverPanelService
from app.services.caregiver_service import CaregiverService

router = APIRouter(prefix="/caregiver")


@router.get("/invitations", response_model=list[CaregiverOutput])
def list_pending_invitations(
    current_user: CurrentUser = Depends(get_current_user),
    service: CaregiverService = Depends(get_caregiver_service),
) -> list[CaregiverOutput]:
    invitations = service.list_pending_invitations()
    return [CaregiverOutput.from_record(invitation) for invitation in invitations]


@router.post("/invitations/{invitation_id}/accept", response_model=CaregiverOutput)
def accept_invitation(
    invitation_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    service: CaregiverService = Depends(get_caregiver_service),
) -> CaregiverOutput:
    caregiver = service.accept_invitation(invitation_id)
    return CaregiverOutput.from_record(caregiver)


@router.get("/patients", response_model=list[CaregiverOutput])
def list_my_patients(
    current_user: CurrentUser = Depends(get_current_user),
    service: CaregiverService = Depends(get_caregiver_service),
) -> list[CaregiverOutput]:
    patients = service.list_my_patients()
    return [CaregiverOutput.from_record(link) for link in patients]


@router.get("/patients/{patient_id}/stats", response_model=UserStatsOutput)
def get_patient_stats(
    patient_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    service: CaregiverPanelService = Depends(get_caregiver_panel_service),
) -> UserStatsOutput:
    stats = service.get_patient_stats(patient_id)
    return UserStatsOutput.from_record(stats)


@router.get(
    "/patients/{patient_id}/brushing-sessions",
    response_model=Page[BrushingSessionOutput],
)
def list_patient_brushing_sessions(
    patient_id: UUID,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: CurrentUser = Depends(get_current_user),
    service: CaregiverPanelService = Depends(get_caregiver_panel_service),
) -> Page[BrushingSessionOutput]:
    sessions = service.list_patient_brushing_sessions(patient_id, limit, offset)
    items = [BrushingSessionOutput.from_record(session) for session in sessions]
    return Page.of(items, limit, offset)


@router.get(
    "/patients/{patient_id}/appointments",
    response_model=Page[AppointmentOutput],
)
def list_patient_appointments(
    patient_id: UUID,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    status: AppointmentStatus | None = Query(default=None),
    current_user: CurrentUser = Depends(get_current_user),
    service: CaregiverPanelService = Depends(get_caregiver_panel_service),
) -> Page[AppointmentOutput]:
    appointments = service.list_patient_appointments(patient_id, limit, offset, status)
    items = [AppointmentOutput.from_record(appointment) for appointment in appointments]
    return Page.of(items, limit, offset)
