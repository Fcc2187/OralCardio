"""Ponto único de composição da injeção de dependências da API.

Cada `get_*_service` monta repositórios concretos sobre o client Supabase
escopado ao usuário autenticado e os injeta nos services via suas interfaces.
Trocar uma implementação de repositório ou service é uma mudança localizada
neste arquivo — nenhum endpoint precisa ser tocado.
"""

from fastapi import Depends
from supabase import Client

from app.core.clock import BusinessClock, SaoPauloBusinessClock, UtcClock
from app.core.config import get_settings
from app.core.exceptions import ServiceUnavailableError
from app.core.security import get_user_scoped_client
from app.core.supabase_client import (
    create_background_job_client,
    get_privileged_supabase_client,
)
from app.domain.achievements import AchievementEvaluator
from app.repositories.appointment_repository import SupabaseAppointmentRepository
from app.repositories.brushing_repository import SupabaseBrushingRepository
from app.repositories.education_repository import SupabaseEducationRepository
from app.repositories.flossing_repository import SupabaseFlossingRepository
from app.repositories.gamification_repository import (
    SupabaseAchievementEvaluationDispatchRepository,
    SupabaseGamificationRepository,
)
from app.repositories.health_profile_repository import SupabaseHealthProfileRepository
from app.repositories.notification_repository import (
    SupabaseNotificationDispatchRepository,
    SupabaseNotificationRepository,
)
from app.repositories.user_repository import SupabaseUserRepository
from app.services.achievement_snapshot_builder import AchievementSnapshotBuilder
from app.services.appointment_service import AppointmentService
from app.services.brushing_service import BrushingService
from app.services.dashboard_service import DashboardService
from app.services.education_service import EducationService
from app.services.flossing_service import FlossingService
from app.services.gamification_service import GamificationService
from app.services.health_profile_service import HealthProfileService
from app.services.notification_service import (
    AchievementEvaluationDispatchService,
    BackgroundJobDispatchService,
    NotificationDispatchService,
    NotificationService,
)
from app.services.user_service import UserService
from app.services.web_push_gateway import VapidWebPushGateway


def get_user_service(client: Client = Depends(get_user_scoped_client)) -> UserService:
    return UserService(SupabaseUserRepository(client))


def get_business_clock() -> BusinessClock:
    return SaoPauloBusinessClock()


def get_gamification_service(
    client: Client = Depends(get_user_scoped_client),
    clock: BusinessClock = Depends(get_business_clock),
) -> GamificationService:
    snapshot_builder = AchievementSnapshotBuilder(
        education_repository=SupabaseEducationRepository(client),
        health_profile_repository=SupabaseHealthProfileRepository(client),
        appointment_repository=SupabaseAppointmentRepository(client),
    )
    return GamificationService(
        gamification_repository=SupabaseGamificationRepository(
            client, write_client=get_privileged_supabase_client()
        ),
        snapshot_builder=snapshot_builder,
        evaluator=AchievementEvaluator(),
        clock=clock,
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


def get_dashboard_service(
    user_service: UserService = Depends(get_user_service),
    health_profile_service: HealthProfileService = Depends(get_health_profile_service),
    gamification_service: GamificationService = Depends(get_gamification_service),
    clock: BusinessClock = Depends(get_business_clock),
) -> DashboardService:
    return DashboardService(user_service, health_profile_service, gamification_service, clock)


def get_notification_service(
    client: Client = Depends(get_user_scoped_client),
) -> NotificationService:
    settings = get_settings()
    return NotificationService(
        repository=SupabaseNotificationRepository(client),
        vapid_public_key=settings.web_push_vapid_public_key,
        vapid_key_version=settings.web_push_vapid_key_version,
    )


def get_background_job_dispatch_service() -> BackgroundJobDispatchService:
    settings = get_settings()
    if not settings.is_notification_dispatch_configured:
        raise ServiceUnavailableError("Dispatcher de notificações não configurado")
    client = create_background_job_client()
    clock = UtcClock()
    notification_dispatcher = NotificationDispatchService(
        repository=SupabaseNotificationDispatchRepository(client),
        gateway=VapidWebPushGateway(
            private_key=settings.web_push_vapid_private_key,
            subject=settings.web_push_vapid_subject,
            timeout_seconds=settings.notification_push_timeout_seconds,
        ),
        clock=clock,
        batch_size=settings.notification_dispatch_batch_size,
        lease_seconds=settings.notification_dispatch_lease_seconds,
        max_workers=settings.notification_dispatch_workers,
    )
    gamification_service = GamificationService(
        gamification_repository=SupabaseGamificationRepository(client),
        snapshot_builder=AchievementSnapshotBuilder(
            education_repository=SupabaseEducationRepository(client),
            health_profile_repository=SupabaseHealthProfileRepository(client),
            appointment_repository=SupabaseAppointmentRepository(client),
        ),
        evaluator=AchievementEvaluator(),
        clock=SaoPauloBusinessClock(),
    )
    achievement_dispatcher = AchievementEvaluationDispatchService(
        repository=SupabaseAchievementEvaluationDispatchRepository(client),
        gamification_service=gamification_service,
        clock=clock,
        batch_size=settings.achievement_dispatch_batch_size,
        lease_seconds=settings.achievement_dispatch_lease_seconds,
    )
    return BackgroundJobDispatchService(notification_dispatcher, achievement_dispatcher)
