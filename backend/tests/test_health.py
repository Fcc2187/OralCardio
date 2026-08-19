from starlette.testclient import TestClient


def test_health_endpoint_returns_healthy_status(client: TestClient) -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"api": True, "database": True}
