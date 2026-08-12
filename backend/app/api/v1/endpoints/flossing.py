from fastapi import APIRouter, Depends, Query

from app.api.deps import get_flossing_service
from app.core.security import CurrentUser, get_current_user
from app.schemas.common import Page
from app.schemas.flossing import FlossingLogInput, FlossingLogOutput
from app.schemas.gamification import WithUnlockedAchievements, unlocked_achievements_output
from app.services.flossing_service import FlossingService

router = APIRouter()


@router.post(
    "/flossing-logs", response_model=WithUnlockedAchievements[FlossingLogOutput], status_code=201
)
def create_flossing_log(
    payload: FlossingLogInput,
    current_user: CurrentUser = Depends(get_current_user),
    service: FlossingService = Depends(get_flossing_service),
) -> WithUnlockedAchievements[FlossingLogOutput]:
    result = service.log_flossing(current_user.id, payload.notes)
    return WithUnlockedAchievements(
        data=FlossingLogOutput.from_record(result.value),
        unlocked_achievements=unlocked_achievements_output(result.unlocked_achievements),
    )


@router.get("/flossing-logs", response_model=Page[FlossingLogOutput])
def list_flossing_logs(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: CurrentUser = Depends(get_current_user),
    service: FlossingService = Depends(get_flossing_service),
) -> Page[FlossingLogOutput]:
    logs = service.list_logs(current_user.id, limit, offset)
    items = [FlossingLogOutput.from_record(log) for log in logs]
    return Page.of(items, limit, offset)
