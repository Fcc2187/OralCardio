from starlette.testclient import TestClient


def test_health_endpoint_returns_healthy_status(client: TestClient) -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"api": True, "database": True}


def test_liveness_does_not_depend_on_database(client: TestClient) -> None:
    response = client.get("/api/v1/health/live")

    assert response.status_code == 200
    assert response.json() == {"api": True, "database": False}
    assert response.headers["cache-control"] == "no-store"


def test_api_security_headers_are_present(client: TestClient) -> None:
    response = client.get("/api/v1/health")

    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["referrer-policy"] == "no-referrer"
