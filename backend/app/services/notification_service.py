import logging
from dataclasses import dataclass
from datetime import datetime, timedelta
from uuid import UUID

from app.core.clock import InstantClock
from app.core.exceptions import ServiceUnavailableError
from app.domain.enums import PushDeliveryOutcome
from app.domain.notifications import (
    NotificationPreferencesUpdate,
    retry_delay_seconds,
    validate_notification_preferences,
)
from app.repositories.interfaces import NotificationDispatchRepository, NotificationRepository
from app.repositories.records import NotificationPreferencesRecord, PushSubscriptionRecord
from app.services.interfaces import PushGateway

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
    ) -> PushSubscriptionRecord:
        self.get_vapid_public_key()
        return self._repository.upsert_subscription(
            endpoint=endpoint,
            p256dh=p256dh,
            auth_secret=auth_secret,
            expiration_time=expiration_time,
            device_label=device_label,
            vapid_key_version=self._vapid_key_version,
        )

    def unsubscribe(self, endpoint: str) -> bool:
        return self._repository.unsubscribe(endpoint)

    def request_test_notification(self) -> UUID:
        self.get_vapid_public_key()
        return self._repository.request_test_notification()


@dataclass(frozen=True)
class DispatchSummary:
    claimed: int
    sent: int
    retried: int
    revoked: int
    dead: int


class NotificationDispatchService:
    def __init__(
        self,
        repository: NotificationDispatchRepository,
        gateway: PushGateway,
        clock: InstantClock,
    ) -> None:
        self._repository = repository
        self._gateway = gateway
        self._clock = clock

    def dispatch_once(self, batch_size: int = 100) -> DispatchSummary:
        now = self._clock.now()
        deliveries = self._repository.claim_due_deliveries(batch_size, 120, now)
        counters = {outcome: 0 for outcome in PushDeliveryOutcome}

        for delivery in deliveries:
            result = self._gateway.send(delivery)
            retry_at = None
            if result.outcome is PushDeliveryOutcome.RETRY:
                retry_at = now + timedelta(
                    seconds=retry_delay_seconds(
                        delivery.attempt_count, delivery.delivery_id.int
                    )
                )
            self._repository.complete_delivery(
                delivery.delivery_id,
                result.outcome.value,
                result.error_code,
                retry_at,
            )
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
