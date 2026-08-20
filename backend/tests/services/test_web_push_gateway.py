import base64
import os
from uuid import uuid4

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec

from app.domain.enums import NotificationType, PushDeliveryOutcome
from app.repositories.records import ClaimedNotificationDeliveryRecord
from app.services.web_push_gateway import VapidWebPushGateway


def private_pem() -> str:
    private_key = ec.generate_private_key(ec.SECP256R1())
    return private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode("ascii")


def claimed_delivery() -> ClaimedNotificationDeliveryRecord:
    public_key = ec.generate_private_key(ec.SECP256R1()).public_key()
    encoded_public_key = public_key.public_bytes(
        encoding=serialization.Encoding.X962,
        format=serialization.PublicFormat.UncompressedPoint,
    )

    def encode(value: bytes) -> str:
        return base64.urlsafe_b64encode(value).rstrip(b"=").decode()
    return ClaimedNotificationDeliveryRecord(
        delivery_id=uuid4(),
        job_id=uuid4(),
        notification_type=NotificationType.TEST,
        endpoint="https://fcm.googleapis.com/fcm/send/subscription",
        p256dh=encode(encoded_public_key),
        auth_secret=encode(os.urandom(16)),
        payload={"title": "OralCardio", "body": "Teste", "url": "/", "tag": "test"},
        attempt_count=0,
        lease_token=uuid4(),
    )


def test_gateway_reports_success(monkeypatch) -> None:
    monkeypatch.setattr("app.services.web_push_gateway.webpush", lambda **_: None)
    result = VapidWebPushGateway(private_pem(), "mailto:test@example.com").send(
        claimed_delivery()
    )
    assert result.outcome is PushDeliveryOutcome.SENT


def test_gateway_treats_network_failure_as_retry(monkeypatch) -> None:
    def fail(**_):
        raise OSError("network unavailable")

    monkeypatch.setattr("app.services.web_push_gateway.webpush", fail)
    result = VapidWebPushGateway(private_pem(), "mailto:test@example.com").send(
        claimed_delivery()
    )
    assert result.outcome is PushDeliveryOutcome.RETRY
    assert result.error_code == "web_push_network"


def test_gateway_uses_escaped_pem_with_real_pywebpush_signing(monkeypatch) -> None:
    class AcceptedResponse:
        status_code = 201

    monkeypatch.setattr(
        "pywebpush.WebPusher.send",
        lambda *_args, **_kwargs: AcceptedResponse(),
    )
    escaped_pem = private_pem().strip().replace("\n", "\\n")

    result = VapidWebPushGateway(escaped_pem, "mailto:test@example.com").send(
        claimed_delivery()
    )

    assert result.outcome is PushDeliveryOutcome.SENT
