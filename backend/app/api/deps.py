"""Ponto único de composição da injeção de dependências da API.

Cada `get_*_service` monta repositórios concretos sobre o client Supabase
escopado ao usuário autenticado e os injeta nos services via suas interfaces.
Trocar uma implementação de repositório ou service é uma mudança localizada
neste arquivo — nenhum endpoint precisa ser tocado.
"""

from fastapi import Depends
from supabase import Client

from app.core.security import get_user_scoped_client
from app.domain.achievements import AchievementEvaluator
from app.repositories.brushing_repository import SupabaseBrushingRepository
from app.repositories.education_repository import SupabaseEducationRepository
from app.repositories.flossing_repository import SupabaseFlossingRepository
from app.repositories.gamification_repository import SupabaseGamificationRepository
from app.repositories.health_profile_repository import SupabaseHealthProfileRepository
from app.repositories.user_repository import SupabaseUserRepository
from app.services.brushing_service import BrushingService
from app.services.dashboard_service import DashboardService
from app.services.education_service import EducationService
from app.services.flossing_service import FlossingService
from app.services.gamification_service import GamificationService
from app.services.health_profile_service import HealthProfileService
from app.services.user_service import UserService


def get_user_service(client: Client = Depends(get_user_scoped_client)) -> UserService:
    return UserService(SupabaseUserRepository(client))


def get_gamification_service(
    client: Client = Depends(get_user_scoped_client),
) -> GamificationService:
    return GamificationService(
        gamification_repository=SupabaseGamificationRepository(client),
        education_repository=SupabaseEducationRepository(client),
        health_profile_repository=SupabaseHealthProfileRepository(client),
        evaluator=AchievementEvaluator(),
    )


def get_health_profile_service(
    client: Client = Depends(get_user_scoped_client),
    gamification_service: GamificationService = Depends(get_gamification_service),
) -> HealthProfileService:
    return HealthProfileService(SupabaseHealthProfileRepository(client), gamification_service)


def get_brushing_service(
    client: Client = Depends(get_user_scoped_client),
    gamification_service: GamificationService = Depends(get_gamification_service),
) -> BrushingService:
    return BrushingService(SupabaseBrushingRepository(client), gamification_service)


def get_flossing_service(
    client: Client = Depends(get_user_scoped_client),
    gamification_service: GamificationService = Depends(get_gamification_service),
) -> FlossingService:
    return FlossingService(SupabaseFlossingRepository(client), gamification_service)


def get_education_service(
    client: Client = Depends(get_user_scoped_client),
    gamification_service: GamificationService = Depends(get_gamification_service),
) -> EducationService:
    return EducationService(SupabaseEducationRepository(client), gamification_service)


def get_dashboard_service(
    user_service: UserService = Depends(get_user_service),
    health_profile_service: HealthProfileService = Depends(get_health_profile_service),
    gamification_service: GamificationService = Depends(get_gamification_service),
) -> DashboardService:
    return DashboardService(user_service, health_profile_service, gamification_service)
