from fastapi import APIRouter, Depends

from app.api.deps import get_health_profile_service
from app.core.security import CurrentUser, get_current_user
from app.schemas.health_profile import HealthProfileInput, HealthProfileOutput
from app.services.health_profile_service import HealthProfileService

router = APIRouter()


@router.get("/health-profile", response_model=HealthProfileOutput | None)
def get_health_profile(
    current_user: CurrentUser = Depends(get_current_user),
    service: HealthProfileService = Depends(get_health_profile_service),
) -> HealthProfileOutput | None:
    profile = service.get_profile(current_user.id)
    return HealthProfileOutput.from_record(profile) if profile else None


@router.put("/health-profile", response_model=HealthProfileOutput)
def submit_health_profile(
    payload: HealthProfileInput,
    current_user: CurrentUser = Depends(get_current_user),
    service: HealthProfileService = Depends(get_health_profile_service),
) -> HealthProfileOutput:
    result = service.submit_questionnaire(
        user_id=current_user.id,
        cardiac_condition=payload.cardiac_condition,
        cardiac_condition_detail=payload.cardiac_condition_detail,
        has_pacemaker=payload.has_pacemaker,
        has_prosthetic_valve=payload.has_prosthetic_valve,
        medications=payload.medications,
        allergies=payload.allergies,
        last_dental_visit=payload.last_dental_visit.isoformat()
        if payload.last_dental_visit
        else None,
        brushing_frequency_before=payload.brushing_frequency_before,
        dentist_name=payload.dentist_name,
        dentist_phone=payload.dentist_phone,
        cardiologist_name=payload.cardiologist_name,
    )
    return HealthProfileOutput.from_record(result)
