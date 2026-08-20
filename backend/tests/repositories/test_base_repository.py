import pytest
from postgrest.exceptions import APIError

from app.core.exceptions import (
    BusinessRuleViolationError,
    ConflictError,
    EntityNotFoundError,
    ServiceUnavailableError,
)
from app.repositories.base import SupabaseRepository


@pytest.fixture
def repository() -> SupabaseRepository:
    # O client nunca é usado diretamente por `_run` (que só chama `operation()`),
    # então `None` é suficiente — evita montar um `supabase.Client` real.
    return SupabaseRepository(client=None)  # type: ignore[arg-type]


def test_run_translates_unique_violation_into_conflict_error(
    repository: SupabaseRepository,
) -> None:
    def operation() -> None:
        raise APIError({"code": "23505", "message": "duplicate key"})

    with pytest.raises(ConflictError, match="registro já existe"):
        repository._run("registro", operation)


def test_run_translates_not_found_into_entity_not_found_error(
    repository: SupabaseRepository,
) -> None:
    def operation() -> None:
        raise APIError({"code": "PGRST116", "message": "no rows"})

    with pytest.raises(EntityNotFoundError):
        repository._run("registro", operation)


def test_run_translates_raise_exception_into_business_rule_violation_with_exact_message(
    repository: SupabaseRepository,
) -> None:
    def operation() -> None:
        raise APIError({"code": "P0001", "message": "Operação não permitida"})

    with pytest.raises(BusinessRuleViolationError, match="^Operação não permitida$"):
        repository._run("registro", operation)


def test_run_falls_back_to_generic_message_when_raise_exception_has_no_message(
    repository: SupabaseRepository,
) -> None:
    def operation() -> None:
        raise APIError({"code": "P0001", "message": ""})

    with pytest.raises(BusinessRuleViolationError, match="registro: operação inválida"):
        repository._run("registro", operation)


def test_run_translates_unknown_database_errors_into_service_unavailable(
    repository: SupabaseRepository,
) -> None:
    def operation() -> None:
        raise APIError({"code": "22P02", "message": "invalid input syntax"})

    with pytest.raises(ServiceUnavailableError, match="temporariamente indisponível"):
        repository._run("registro", operation)


def test_run_returns_operation_result_when_no_error(repository: SupabaseRepository) -> None:
    result = repository._run("registro", lambda: {"id": "123"})

    assert result == {"id": "123"}
