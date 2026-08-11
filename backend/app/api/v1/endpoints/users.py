from fastapi import APIRouter, Depends

from app.api.deps import get_user_service
from app.core.security import CurrentUser, get_current_user
from app.schemas.user import UserOutput, UserUpdateInput
from app.services.user_service import UserService

router = APIRouter()


@router.get("/users/me", response_model=UserOutput)
def get_my_profile(
    current_user: CurrentUser = Depends(get_current_user),
    service: UserService = Depends(get_user_service),
) -> UserOutput:
    return UserOutput.from_record(service.get_profile(current_user.id))


@router.patch("/users/me", response_model=UserOutput)
def update_my_profile(
    payload: UserUpdateInput,
    current_user: CurrentUser = Depends(get_current_user),
    service: UserService = Depends(get_user_service),
) -> UserOutput:
    updated = service.update_profile(
        current_user.id, payload.full_name, payload.phone, payload.avatar_url
    )
    return UserOutput.from_record(updated)
