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
from app.notifications.email_sender import EmailSender, LoggingEmailSender
from app.repositories.appointment_repository import SupabaseAppointmentRepository
from app.repositories.brushing_repository import SupabaseBrushingRepository
from app.repositories.caregiver_repository import SupabaseCaregiverRepository
from app.repositories.education_repository import SupabaseEducationRepository
from app.repositories.flossing_repository import SupabaseFlossingRepository
from app.repositories.gamification_repository import SupabaseGamificationRepository
from app.repositories.health_profile_repository import SupabaseHealthProfileRepository
from app.repositories.user_repository import SupabaseUserRepository
from app.services.achievement_snapshot_builder import AchievementSnapshotBuilder
from app.services.appointment_service import AppointmentService
from app.services.brushing_service import BrushingService
from app.services.caregiver_panel_service import CaregiverPanelService
from app.services.caregiver_service import CaregiverService
from app.services.dashboard_service import DashboardService
from app.services.education_service import EducationService
from app.services.flossing_service import FlossingService
from app.services.gamification_service import GamificationService
from app.services.health_profile_service import HealthProfileService
from app.services.user_service import UserService


def get_user_service(client: Client = Depends(get_user_scoped_client)) -> UserService:
    return UserService(SupabaseUserRepository(client))


def get_email_sender() -> EmailSender:
    return LoggingEmailSender()


def get_gamification_service(
    client: Client = Depends(get_user_scoped_client),
) -> GamificationService:
    snapshot_builder = AchievementSnapshotBuilder(
        education_repository=SupabaseEducationRepository(client),
        health_profile_repository=SupabaseHealthProfileRepository(client),
        appointment_repository=SupabaseAppointmentRepository(client),
    )
    return GamificationService(
        gamification_repository=SupabaseGamificationRepository(client),
        snapshot_builder=snapshot_builder,
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


def get_appointment_service(
    client: Client = Depends(get_user_scoped_client),
    gamification_service: GamificationService = Depends(get_gamification_service),
) -> AppointmentService:
    return AppointmentService(SupabaseAppointmentRepository(client), gamification_service)


def get_caregiver_service(
    client: Client = Depends(get_user_scoped_client),
    email_sender: EmailSender = Depends(get_email_sender),
) -> CaregiverService:
    return CaregiverService(SupabaseCaregiverRepository(client), email_sender)


def get_caregiver_panel_service(
    client: Client = Depends(get_user_scoped_client),
) -> CaregiverPanelService:
    """O client aqui é escopado ao JWT de quem está chamando — quando estes
    endpoints são usados, é o próprio cuidador. As políticas de RLS de
    `database/007_caregiver_access.sql` decidem, no banco, quais linhas do
    paciente esse client enxerga.
    """
    return CaregiverPanelService(
        caregiver_repository=SupabaseCaregiverRepository(client),
        user_repository=SupabaseUserRepository(client),
        gamification_repository=SupabaseGamificationRepository(client),
        brushing_repository=SupabaseBrushingRepository(client),
        appointment_repository=SupabaseAppointmentRepository(client),
    )


def get_dashboard_service(
    user_service: UserService = Depends(get_user_service),
    health_profile_service: HealthProfileService = Depends(get_health_profile_service),
    gamification_service: GamificationService = Depends(get_gamification_service),
) -> DashboardService:
    return DashboardService(user_service, health_profile_service, gamification_service)
