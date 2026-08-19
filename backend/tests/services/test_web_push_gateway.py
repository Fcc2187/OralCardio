from uuid import uuid4

from app.domain.enums import NotificationType, PushDeliveryOutcome
from app.repositories.records import ClaimedNotificationDeliveryRecord
from app.services.web_push_gateway import VapidWebPushGateway


def claimed_delivery() -> ClaimedNotificationDeliveryRecord:
    return ClaimedNotificationDeliveryRecord(
        delivery_id=uuid4(),
        job_id=uuid4(),
        notification_type=NotificationType.TEST,
        endpoint="https://push.example/subscription",
        p256dh="a" * 32,
        auth_secret="b" * 16,
        payload={"title": "OralCardio", "body": "Teste", "url": "/", "tag": "test"},
        attempt_count=0,
    )


def test_gateway_reports_success(monkeypatch) -> None:
    monkeypatch.setattr("app.services.web_push_gateway.webpush", lambda **_: None)
    result = VapidWebPushGateway("private", "mailto:test@example.com").send(
        claimed_delivery()
    )
    assert result.outcome is PushDeliveryOutcome.SENT


def test_gateway_treats_network_failure_as_retry(monkeypatch) -> None:
    def fail(**_):
        raise OSError("network unavailable")

    monkeypatch.setattr("app.services.web_push_gateway.webpush", fail)
    result = VapidWebPushGateway("private", "mailto:test@example.com").send(
        claimed_delivery()
    )
    assert result.outcome is PushDeliveryOutcome.RETRY
    assert result.error_code == "web_push_network"

