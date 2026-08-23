from fastapi.testclient import TestClient

from app.api import deps
from app.api.v1.endpoints import health as health_endpoint
from app.main import app


class _HealthyRepository:
    def ping(self) -> bool:
        return True


class _RevocationRepository:
    def __init__(self) -> None:
        self.calls = 0

    def revoke_with_token(self, endpoint: str, revocation_token: str) -> bool:
        self.calls += 1
        return True


def test_oversized_body_is_rejected_before_revocation_repository() -> None:
    repository = _RevocationRepository()
    app.dependency_overrides[deps.get_push_revocation_repository] = lambda: repository

    try:
        with TestClient(app, client=("oversized-body-test", 50000)) as client:
            response = client.post(
                "/api/v1/notifications/revocations",
                json={
                    "endpoint": "https://updates.push.services.mozilla.com/" + "a" * 65_536,
                    "revocation_token": "a" * 43,
                },
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 413, response.text
    assert repository.calls == 0


def test_chunked_oversized_body_is_rejected_before_revocation_repository() -> None:
    repository = _RevocationRepository()
    app.dependency_overrides[deps.get_push_revocation_repository] = lambda: repository
    body = iter([b'{"endpoint":"https://updates.push.services.mozilla.com/', b"a" * 65_536])

    try:
        with TestClient(app, client=("chunked-body-test", 50000)) as client:
            response = client.post(
                "/api/v1/notifications/revocations",
                content=body,
                headers={"Content-Type": "application/json"},
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 413, response.text
    assert repository.calls == 0


def test_valid_revocation_request_remains_available() -> None:
    repository = _RevocationRepository()
    app.dependency_overrides[deps.get_push_revocation_repository] = lambda: repository

    try:
        with TestClient(app, client=("valid-revocation-test", 50000)) as client:
            response = client.post(
                "/api/v1/notifications/revocations",
                json={
                    "endpoint": "https://updates.push.services.mozilla.com/wpush/v2/device",
                    "revocation_token": "a" * 43,
                },
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {"unsubscribed": True}
    assert repository.calls == 1


def test_dependency_backed_public_routes_throttle_bursts() -> None:
    app.dependency_overrides[health_endpoint.get_health_repository] = _HealthyRepository

    try:
        with TestClient(app, client=("rate-limit-test", 50000)) as client:
            responses = [client.get("/api/v1/health") for _ in range(61)]
    finally:
        app.dependency_overrides.clear()

    assert responses[0].status_code == 200
    assert responses[-1].status_code == 429
    assert responses[-1].headers["retry-after"]
