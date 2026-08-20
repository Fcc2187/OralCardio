from starlette.testclient import TestClient


def test_notification_preferences_require_authentication(client: TestClient) -> None:
    response = client.get("/api/v1/notifications/preferences")
    assert response.status_code == 401


def test_push_subscription_requires_authentication(client: TestClient) -> None:
    response = client.post(
        "/api/v1/notifications/subscriptions",
        json={
            "endpoint": "https://push.example/subscription",
            "keys": {"p256dh": "a" * 20, "auth": "b" * 10},
            "expiration_time": None,
            "device_label": "Teste",
            "revocation_token": "a" * 43,
        },
    )
    assert response.status_code == 401


def test_internal_dispatch_is_unavailable_without_configuration(client: TestClient) -> None:
    response = client.post("/internal/v1/notifications/dispatch")
    assert response.status_code == 503
