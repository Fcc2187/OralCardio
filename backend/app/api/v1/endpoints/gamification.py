from fastapi import APIRouter, Depends

from app.api.deps import get_gamification_service
from app.core.security import CurrentUser, get_current_user
from app.schemas.gamification import (
    AchievementOutput,
    AchievementRevealAcknowledgeInput,
    AchievementRevealOutput,
    UserStatsOutput,
)
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


@router.post(
    "/gamification/achievement-reveals/claim",
    response_model=list[AchievementRevealOutput],
)
def claim_achievement_reveals(
    _: CurrentUser = Depends(get_current_user),
    service: GamificationService = Depends(get_gamification_service),
) -> list[AchievementRevealOutput]:
    return [AchievementRevealOutput.from_record(record) for record in service.claim_due_reveals()]


@router.post("/gamification/achievement-reveals/acknowledge", status_code=204)
def acknowledge_achievement_reveals(
    payload: AchievementRevealAcknowledgeInput,
    _: CurrentUser = Depends(get_current_user),
    service: GamificationService = Depends(get_gamification_service),
) -> None:
    service.acknowledge_reveals(payload.achievement_ids)
