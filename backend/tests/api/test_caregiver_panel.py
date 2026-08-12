from fastapi.testclient import TestClient


def test_caregiver_endpoints_require_authentication(client: TestClient) -> None:
    assert client.get("/api/v1/caregiver/invitations").status_code == 401
    assert client.get("/api/v1/caregiver/patients").status_code == 401
    assert client.get("/api/v1/appointments").status_code == 401
