from dataclasses import dataclass
from typing import Protocol
from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client

from app.core.exceptions import AuthenticationError
from app.core.supabase_client import create_user_scoped_client, get_supabase_client

_bearer_scheme = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    id: UUID
    email: str | None
    access_token: str


class TokenVerifier(Protocol):
    """Contrato para validar um access token e resolver o usuário autenticado."""

    def verify(self, access_token: str) -> CurrentUser: ...


class SupabaseTokenVerifier:
    """Valida o token chamando o Supabase Auth (`auth.get_user`).

    Custa um round-trip de rede por requisição, mas é a validação mais simples
    de auditar. Como `get_current_user` depende só da interface `TokenVerifier`,
    trocar por verificação local via JWKS no futuro não exige tocar em nenhum
    endpoint ou service.
    """

    def __init__(self, anonymous_client: Client) -> None:
        self._client = anonymous_client

    def verify(self, access_token: str) -> CurrentUser:
        try:
            response = self._client.auth.get_user(access_token)
        except Exception as exc:
            raise AuthenticationError("Token inválido ou expirado") from exc

        user = response.user if response else None
        if user is None:
            raise AuthenticationError("Token inválido ou expirado")

        return CurrentUser(id=UUID(user.id), email=user.email, access_token=access_token)


def get_token_verifier() -> TokenVerifier:
    client = get_supabase_client()
    if client is None:
        raise AuthenticationError("Supabase não configurado")
    return SupabaseTokenVerifier(client)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    verifier: TokenVerifier = Depends(get_token_verifier),
) -> CurrentUser:
    if credentials is None:
        raise AuthenticationError("Token de autenticação ausente")
    return verifier.verify(credentials.credentials)


def get_user_scoped_client(current_user: CurrentUser = Depends(get_current_user)) -> Client:
    return create_user_scoped_client(current_user.access_token)
