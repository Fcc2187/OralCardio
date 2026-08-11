from uuid import UUID

from fastapi import APIRouter, Depends

from app.api.deps import get_education_service
from app.core.security import CurrentUser, get_current_user
from app.schemas.education import EducationModuleOutput, ModuleCompleteInput
from app.services.education_service import EducationService

router = APIRouter()


@router.get("/education/modules", response_model=list[EducationModuleOutput])
def list_modules(
    current_user: CurrentUser = Depends(get_current_user),
    service: EducationService = Depends(get_education_service),
) -> list[EducationModuleOutput]:
    entries = service.list_modules_with_progress(current_user.id)
    return [EducationModuleOutput.from_module_with_progress(entry) for entry in entries]


@router.get("/education/modules/{slug}", response_model=EducationModuleOutput)
def get_module(
    slug: str,
    current_user: CurrentUser = Depends(get_current_user),
    service: EducationService = Depends(get_education_service),
) -> EducationModuleOutput:
    entry = service.get_module_by_slug(current_user.id, slug)
    return EducationModuleOutput.from_module_with_progress(entry)


@router.post("/education/modules/{module_id}/start", response_model=EducationModuleOutput)
def start_module(
    module_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    service: EducationService = Depends(get_education_service),
) -> EducationModuleOutput:
    entry = service.start_module(current_user.id, module_id)
    return EducationModuleOutput.from_module_with_progress(entry)


@router.post("/education/modules/{module_id}/complete", response_model=EducationModuleOutput)
def complete_module(
    module_id: UUID,
    payload: ModuleCompleteInput,
    current_user: CurrentUser = Depends(get_current_user),
    service: EducationService = Depends(get_education_service),
) -> EducationModuleOutput:
    entry = service.complete_module(current_user.id, module_id, payload.read_time_seconds)
    return EducationModuleOutput.from_module_with_progress(entry)
