from fastapi.testclient import TestClient


def test_protected_endpoint_without_token_returns_401(client: TestClient) -> None:
    response = client.get("/api/v1/users/me")

    assert response.status_code == 401
