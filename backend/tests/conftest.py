import os

os.environ["ENV"] = "test"

import pytest
from starlette.testclient import TestClient

from app.api.v1.endpoints import health as health_endpoint
from app.main import app


class FakeHealthyRepository:
    def ping(self) -> bool:
        return True


@pytest.fixture
def client() -> TestClient:
    app.dependency_overrides[health_endpoint.get_health_repository] = FakeHealthyRepository
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
