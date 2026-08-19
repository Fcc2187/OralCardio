from datetime import UTC, datetime
from uuid import uuid4

from starlette.testclient import TestClient

from app.api.deps import get_user_service
from app.core.security import CurrentUser, get_current_user
from app.main import app
from app.repositories.records import UserRecord
from app.services.user_service import UserService
from tests.fakes.user_repository import FakeUserRepository


def test_get_my_profile_returns_authenticated_users_data(client: TestClient) -> None:
    user_id = uuid4()
    now = datetime.now(UTC)
    record = UserRecord(
        id=user_id,
        full_name="Maria Silva",
        avatar_url=None,
        phone=None,
        date_of_birth=None,
        created_at=now,
        updated_at=now,
    )
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(
        id=user_id, email="maria@example.com", access_token="fake-token"
    )
    app.dependency_overrides[get_user_service] = lambda: UserService(
        FakeUserRepository({user_id: record})
    )

    response = client.get("/api/v1/users/me")

    assert response.status_code == 200
    assert response.json()["full_name"] == "Maria Silva"


def test_cannot_fetch_another_users_profile_by_swapping_token(client: TestClient) -> None:
    """O client autenticado com o JWT do usuário A só pode ver os dados de A.

    Este teste documenta a intenção: no service, `get_profile` sempre usa o
    `user_id` extraído do token corrente, nunca um valor vindo da requisição.
    O isolamento real entre pacientes é reforçado pelo RLS do banco (ver
    database/004_rls_policies.sql), que não pode ser exercitado aqui sem uma
    conexão real ao Supabase.
    """
    user_a_id = uuid4()
    user_b_id = uuid4()
    now = datetime.now(UTC)
    users = {
        user_a_id: UserRecord(
            id=user_a_id,
            full_name="Paciente A",
            avatar_url=None,
            phone=None,
            date_of_birth=None,
            created_at=now,
            updated_at=now,
        ),
        user_b_id: UserRecord(
            id=user_b_id,
            full_name="Paciente B",
            avatar_url=None,
            phone=None,
            date_of_birth=None,
            created_at=now,
            updated_at=now,
        ),
    }
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(
        id=user_a_id, email="a@example.com", access_token="fake-token"
    )
    app.dependency_overrides[get_user_service] = lambda: UserService(FakeUserRepository(users))

    response = client.get("/api/v1/users/me")

    assert response.json()["full_name"] == "Paciente A"
