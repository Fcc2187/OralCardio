from datetime import UTC, datetime, time, timedelta
from uuid import UUID, uuid4

import pytest

from app.core.exceptions import ServiceUnavailableError
from app.domain.enums import NotificationType, PushDeliveryOutcome
from app.domain.notifications import NotificationPreferencesUpdate
from app.repositories.records import (
    ClaimedNotificationDeliveryRecord,
    NotificationPreferencesRecord,
    PushSubscriptionRecord,
)
from app.services.interfaces import PushSendResult
from app.services.notification_service import NotificationDispatchService, NotificationService


class FakeNotificationRepository:
    def __init__(self) -> None:
        self.updated: dict | None = None

    def get_preferences(self, user_id: UUID) -> NotificationPreferencesRecord:
        now = datetime.now(UTC)
        return NotificationPreferencesRecord(
            id=uuid4(),
            user_id=user_id,
            enabled=False,
            brushing_enabled=False,
            brushing_times=(time(8), time(20)),
            flossing_enabled=False,
            flossing_time=time(21),
            appointments_enabled=False,
            appointment_lead_minutes=(1440, 120),
            quiet_hours_start=time(22),
            quiet_hours_end=time(7),
            consented_at=None,
            created_at=now,
            updated_at=now,
        )

    def update_preferences(self, user_id: UUID, **values) -> NotificationPreferencesRecord:
        self.updated = values
        return self.get_preferences(user_id)

    def upsert_subscription(self, **_) -> PushSubscriptionRecord:
        return PushSubscriptionRecord(id=uuid4(), active=True)

    def unsubscribe(self, endpoint: str) -> bool:
        return bool(endpoint)

    def request_test_notification(self) -> UUID:
        return uuid4()


def test_notification_service_requires_configured_public_key() -> None:
    service = NotificationService(FakeNotificationRepository(), "", 1)
    with pytest.raises(ServiceUnavailableError):
        service.get_vapid_public_key()


def test_update_preferences_serializes_times_for_repository() -> None:
    repository = FakeNotificationRepository()
    service = NotificationService(repository, "public", 1)
    service.update_preferences(
        uuid4(),
        NotificationPreferencesUpdate(
            enabled=True,
            brushing_enabled=True,
            brushing_times=(time(8), time(20)),
            flossing_enabled=True,
            flossing_time=time(21),
            appointments_enabled=True,
            appointment_lead_minutes=(1440, 120),
            quiet_hours_start=time(22),
            quiet_hours_end=time(7),
        ),
    )
    assert repository.updated is not None
    assert repository.updated["brushing_times"] == ("08:00", "20:00")
    assert repository.updated["flossing_time"] == "21:00"


class FixedClock:
    value = datetime(2026, 8, 19, 12, tzinfo=UTC)

    def now(self) -> datetime:
        return self.value


class FakeDispatchRepository:
    def __init__(self, deliveries: list[ClaimedNotificationDeliveryRecord]) -> None:
        self.deliveries = deliveries
        self.completions: list[tuple] = []

    def claim_due_deliveries(self, batch_size: int, lease_seconds: int, now: datetime):
        assert (batch_size, lease_seconds, now) == (100, 120, FixedClock.value)
        return self.deliveries

    def complete_delivery(self, delivery_id, outcome, error_code, retry_at) -> None:
        self.completions.append((delivery_id, outcome, error_code, retry_at))


class FakeGateway:
    def __init__(self, outcomes: list[PushSendResult]) -> None:
        self.outcomes = outcomes

    def send(self, _) -> PushSendResult:
        return self.outcomes.pop(0)


def delivery(attempt_count: int = 0) -> ClaimedNotificationDeliveryRecord:
    return ClaimedNotificationDeliveryRecord(
        delivery_id=UUID(int=5),
        job_id=uuid4(),
        notification_type=NotificationType.TEST,
        endpoint="https://push.example/subscription",
        p256dh="a" * 20,
        auth_secret="b" * 10,
        payload={"title": "OralCardio"},
        attempt_count=attempt_count,
    )


def test_dispatch_records_success_without_retry_date() -> None:
    repository = FakeDispatchRepository([delivery()])
    service = NotificationDispatchService(
        repository, FakeGateway([PushSendResult(PushDeliveryOutcome.SENT)]), FixedClock()
    )
    summary = service.dispatch_once()
    assert (summary.claimed, summary.sent) == (1, 1)
    assert repository.completions[0][1:] == ("sent", None, None)


def test_dispatch_schedules_retry_with_backoff() -> None:
    repository = FakeDispatchRepository([delivery(attempt_count=1)])
    service = NotificationDispatchService(
        repository,
        FakeGateway([PushSendResult(PushDeliveryOutcome.RETRY, "web_push_503")]),
        FixedClock(),
    )
    summary = service.dispatch_once()
    assert summary.retried == 1
    assert repository.completions[0][1:3] == ("retry", "web_push_503")
    assert repository.completions[0][3] == FixedClock.value + timedelta(seconds=125)
