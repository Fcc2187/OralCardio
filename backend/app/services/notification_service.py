import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta
from uuid import UUID

from app.application.contracts import (
    AchievementEvaluationDispatchSummary,
    BackgroundDispatchSummary,
    DispatchSummary,
    PushSendResult,
)
from app.core.clock import InstantClock
from app.core.exceptions import ServiceUnavailableError
from app.domain.enums import PushDeliveryOutcome
from app.domain.notifications import (
    NotificationPreferencesUpdate,
    retry_delay_seconds,
    validate_notification_preferences,
)
from app.repositories.interfaces import (
    AchievementEvaluationDispatchRepository,
    NotificationDispatchRepository,
    NotificationRepository,
    NotificationRevocationRepository,
)
from app.repositories.records import NotificationPreferencesRecord, PushSubscriptionRecord
from app.services.interfaces import AchievementEvaluationService, PushGateway

logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(
        self,
        repository: NotificationRepository,
        vapid_public_key: str,
        vapid_key_version: int,
    ) -> None:
        self._repository = repository
        self._vapid_public_key = vapid_public_key
        self._vapid_key_version = vapid_key_version

    def get_preferences(self, user_id: UUID) -> NotificationPreferencesRecord:
        return self._repository.get_preferences(user_id)

    def update_preferences(
        self, user_id: UUID, value: NotificationPreferencesUpdate
    ) -> NotificationPreferencesRecord:
        validate_notification_preferences(value)
        return self._repository.update_preferences(
            user_id,
            enabled=value.enabled,
            brushing_enabled=value.brushing_enabled,
            brushing_times=tuple(
                item.isoformat(timespec="minutes") for item in value.brushing_times
            ),
            flossing_enabled=value.flossing_enabled,
            flossing_time=value.flossing_time.isoformat(timespec="minutes"),
            appointments_enabled=value.appointments_enabled,
            appointment_lead_minutes=value.appointment_lead_minutes,
            quiet_hours_start=value.quiet_hours_start.isoformat(timespec="minutes"),
            quiet_hours_end=value.quiet_hours_end.isoformat(timespec="minutes"),
        )

    def get_vapid_public_key(self) -> tuple[str, int]:
        if not self._vapid_public_key:
            raise ServiceUnavailableError("Notificações push ainda não foram configuradas")
        return self._vapid_public_key, self._vapid_key_version

    def subscribe(
        self,
        *,
        endpoint: str,
        p256dh: str,
        auth_secret: str,
        expiration_time: datetime | None,
        device_label: str | None,
        revocation_token: str,
    ) -> PushSubscriptionRecord:
        self.get_vapid_public_key()
        return self._repository.upsert_subscription(
            endpoint=endpoint,
            p256dh=p256dh,
            auth_secret=auth_secret,
            expiration_time=expiration_time,
            device_label=device_label,
            vapid_key_version=self._vapid_key_version,
            revocation_token=revocation_token,
        )

    def unsubscribe(self, endpoint: str) -> bool:
        return self._repository.unsubscribe(endpoint)

    def request_test_notification(self) -> UUID:
        self.get_vapid_public_key()
        return self._repository.request_test_notification()


class PushRevocationService:
    """Revoga uma capability de dispositivo sem depender da sessão expirada."""

    def __init__(self, repository: NotificationRevocationRepository) -> None:
        self._repository = repository

    def revoke_with_token(self, endpoint: str, revocation_token: str) -> bool:
        return self._repository.revoke_with_token(endpoint, revocation_token)


class NotificationDispatchService:
    def __init__(
        self,
        repository: NotificationDispatchRepository,
        gateway: PushGateway,
        clock: InstantClock,
        batch_size: int = 50,
        lease_seconds: int = 300,
        max_workers: int = 10,
    ) -> None:
        self._repository = repository
        self._gateway = gateway
        self._clock = clock
        self._batch_size = batch_size
        self._lease_seconds = lease_seconds
        self._max_workers = max_workers

    def dispatch_once(self) -> DispatchSummary:
        now = self._clock.now()
        deliveries = self._repository.claim_due_deliveries(
            self._batch_size, self._lease_seconds, now
        )
        counters = {outcome: 0 for outcome in PushDeliveryOutcome}

        with ThreadPoolExecutor(max_workers=self._max_workers) as executor:
            futures = {
                executor.submit(self._gateway.send, delivery): delivery
                for delivery in deliveries
            }
            completed = []
            for future in as_completed(futures):
                delivery = futures[future]
                try:
                    result = future.result()
                except Exception:
                    logger.exception(
                        "notification_delivery_unexpected_error delivery_id=%s",
                        delivery.delivery_id,
                    )
                    result = PushSendResult(
                        PushDeliveryOutcome.RETRY, "unexpected_gateway_error"
                    )
                completed.append((delivery, result))

        for delivery, result in completed:
            retry_at = None
            if result.outcome is PushDeliveryOutcome.RETRY:
                retry_at = self._clock.now() + timedelta(
                    seconds=retry_delay_seconds(
                        delivery.attempt_count, delivery.delivery_id.int
                    )
                )
            try:
                self._repository.complete_delivery(
                    delivery.delivery_id,
                    delivery.lease_token,
                    result.outcome.value,
                    result.error_code,
                    retry_at,
                )
            except Exception:
                # Não abandona os ACKs seguintes: leases sem confirmação podem
                # reenviar uma notificação já entregue.
                logger.exception(
                    "notification_delivery_ack_failed delivery_id=%s",
                    delivery.delivery_id,
                )
                continue
            counters[result.outcome] += 1

        summary = DispatchSummary(
            claimed=len(deliveries),
            sent=counters[PushDeliveryOutcome.SENT],
            retried=counters[PushDeliveryOutcome.RETRY],
            revoked=counters[PushDeliveryOutcome.REVOKED],
            dead=counters[PushDeliveryOutcome.DEAD],
        )
        logger.info(
            "notification_dispatch claimed=%s sent=%s retried=%s revoked=%s dead=%s",
            summary.claimed,
            summary.sent,
            summary.retried,
            summary.revoked,
            summary.dead,
        )
        return summary


class AchievementEvaluationDispatchService:
    def __init__(
        self,
        repository: AchievementEvaluationDispatchRepository,
        gamification_service: AchievementEvaluationService,
        clock: InstantClock,
        batch_size: int = 10,
        lease_seconds: int = 300,
    ) -> None:
        self._repository = repository
        self._gamification_service = gamification_service
        self._clock = clock
        self._batch_size = batch_size
        self._lease_seconds = lease_seconds

    def dispatch_once(self) -> AchievementEvaluationDispatchSummary:
        now = self._clock.now()
        evaluations = self._repository.claim_due_evaluations(
            self._batch_size, self._lease_seconds, now
        )
        succeeded = 0
        retried = 0

        for evaluation in evaluations:
            retry_at = None
            error_code = None
            try:
                self._gamification_service.evaluate_and_unlock(evaluation.user_id)
                was_successful = True
                succeeded += 1
            except Exception:
                logger.exception("achievement_evaluation_retry_scheduled")
                was_successful = False
                retried += 1
                error_code = "achievement_evaluation_failed"
                retry_at = self._clock.now() + timedelta(
                    seconds=retry_delay_seconds(
                        evaluation.attempt_count, evaluation.user_id.int
                    )
                )

            self._repository.complete_evaluation(
                evaluation.user_id,
                evaluation.requested_version,
                evaluation.lease_token,
                was_successful,
                retry_at,
                error_code,
            )

        return AchievementEvaluationDispatchSummary(
            claimed=len(evaluations), succeeded=succeeded, retried=retried
        )


class BackgroundJobDispatchService:
    def __init__(
        self,
        notification_dispatcher: NotificationDispatchService,
        achievement_dispatcher: AchievementEvaluationDispatchService,
    ) -> None:
        self._notification_dispatcher = notification_dispatcher
        self._achievement_dispatcher = achievement_dispatcher

    def dispatch_once(self) -> BackgroundDispatchSummary:
        try:
            notifications = self._notification_dispatcher.dispatch_once()
        except Exception:
            logger.exception("notification_dispatch_failed")
            notifications = DispatchSummary(
                claimed=0, sent=0, retried=0, revoked=0, dead=0
            )
        try:
            achievements = self._achievement_dispatcher.dispatch_once()
        except Exception:
            logger.exception("achievement_dispatch_failed")
            achievements = AchievementEvaluationDispatchSummary(
                claimed=0, succeeded=0, retried=0
            )
        return BackgroundDispatchSummary(
            notifications=notifications,
            achievement_evaluations=achievements,
        )
