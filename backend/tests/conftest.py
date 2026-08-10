import pytest
from fastapi.testclient import TestClient

from app.api.v1.endpoints import health as health_endpoint
from app.main import app
from app.services.health_service import DefaultHealthService


class FakeHealthyRepository:
    def ping(self) -> bool:
        return True


@pytest.fixture
def client() -> TestClient:
    app.dependency_overrides[health_endpoint.get_health_service] = (
        lambda: DefaultHealthService(FakeHealthyRepository())
    )
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
