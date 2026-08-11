from fastapi import APIRouter, Depends

from app.api.deps import get_gamification_service
from app.core.security import CurrentUser, get_current_user
from app.schemas.gamification import AchievementOutput, UserStatsOutput
from app.services.gamification_service import GamificationService

router = APIRouter()


@router.get("/gamification/stats", response_model=UserStatsOutput)
def get_stats(
    current_user: CurrentUser = Depends(get_current_user),
    service: GamificationService = Depends(get_gamification_service),
) -> UserStatsOutput:
    return UserStatsOutput.from_record(service.get_stats(current_user.id))


@router.get("/gamification/achievements", response_model=list[AchievementOutput])
def list_achievements(
    current_user: CurrentUser = Depends(get_current_user),
    service: GamificationService = Depends(get_gamification_service),
) -> list[AchievementOutput]:
    statuses = service.list_achievements(current_user.id)
    return [AchievementOutput.from_status(status) for status in statuses]
