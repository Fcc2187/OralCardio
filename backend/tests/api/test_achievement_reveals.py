from fastapi.testclient import TestClient


def test_claim_achievement_reveals_requires_authentication(client: TestClient) -> None:
    response = client.post("/api/v1/gamification/achievement-reveals/claim")
    assert response.status_code == 401


def test_acknowledge_achievement_reveals_requires_authentication(client: TestClient) -> None:
    response = client.post(
        "/api/v1/gamification/achievement-reveals/acknowledge",
        json={"achievement_ids": ["7ed5b3cd-12d0-4a93-9634-0dc7ed00d837"]},
    )
    assert response.status_code == 401
