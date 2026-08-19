from types import SimpleNamespace
from uuid import uuid4

import pytest
from supabase_auth.errors import AuthApiError, AuthRetryableError

from app.core.exceptions import AuthenticationError, ServiceUnavailableError
from app.core.security import SupabaseTokenVerifier


class _FakeAuth:
    def __init__(self, result=None, error: Exception | None = None) -> None:
        self._result = result
        self._error = error

    def get_user(self, access_token: str):
        if self._error:
            raise self._error
        return self._result


def _verifier(auth: _FakeAuth) -> SupabaseTokenVerifier:
    return SupabaseTokenVerifier(SimpleNamespace(auth=auth))  # type: ignore[arg-type]


def test_invalid_token_is_reported_as_authentication_error() -> None:
    verifier = _verifier(_FakeAuth(error=AuthApiError("bad jwt", 401, "bad_jwt")))

    with pytest.raises(AuthenticationError):
        verifier.verify("invalid")


def test_auth_transport_failure_is_reported_as_service_unavailable() -> None:
    verifier = _verifier(_FakeAuth(error=AuthRetryableError("timeout", 503)))

    with pytest.raises(ServiceUnavailableError):
        verifier.verify("possibly-valid")


def test_valid_token_returns_current_user() -> None:
    user_id = uuid4()
    response = SimpleNamespace(
        user=SimpleNamespace(id=str(user_id), email="patient@example.com")
    )

    current_user = _verifier(_FakeAuth(result=response)).verify("valid")

    assert current_user.id == user_id
    assert current_user.access_token == "valid"
