import base64
import hashlib
import json
import threading
import time
from collections.abc import Iterator
from dataclasses import dataclass
from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client
from supabase_auth.errors import AuthApiError, AuthRetryableError, AuthUnknownError

from app.core.exceptions import AuthenticationError, ServiceUnavailableError
from app.core.supabase_client import create_user_scoped_client, get_supabase_client

_bearer_scheme = HTTPBearer(auto_error=False)
_TOKEN_CACHE_TTL_SECONDS = 60.0
_TOKEN_CACHE_MAX_ENTRIES = 512


@dataclass(frozen=True)
class CurrentUser:
    id: UUID
    email: str | None
    access_token: str


def _extract_jwt_exp(access_token: str) -> float | None:
    """Lê apenas a claim `exp` do payload JWT para nunca cachear além da expiração."""
    parts = access_token.split(".")
    if len(parts) != 3:
        return None
    try:
        payload_b64 = parts[1]
        padding = "=" * (-len(payload_b64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(payload_b64 + padding))
        exp = payload.get("exp")
        return float(exp) if isinstance(exp, (int, float)) else None
    except Exception:
        return None


class _VerifiedTokenCache:
    """Cache TTL curto em memória para reduzir chamadas repetidas ao Supabase Auth."""

    def __init__(
        self,
        ttl_seconds: float = _TOKEN_CACHE_TTL_SECONDS,
        max_entries: int = _TOKEN_CACHE_MAX_ENTRIES,
    ) -> None:
        self._ttl_seconds = ttl_seconds
        self._max_entries = max_entries
        self._lock = threading.Lock()
        self._entries: dict[str, tuple[float, UUID, str | None]] = {}

    @staticmethod
    def _key(access_token: str) -> str:
        return hashlib.sha256(access_token.encode("utf-8")).hexdigest()

    def get(self, access_token: str, now: float | None = None) -> CurrentUser | None:
        current_time = time.time() if now is None else now
        key = self._key(access_token)
        with self._lock:
            entry = self._entries.get(key)
            if entry is None:
                return None
            expires_at, user_id, email = entry
            if expires_at <= current_time:
                self._entries.pop(key, None)
                return None
            return CurrentUser(id=user_id, email=email, access_token=access_token)

    def put(self, user: CurrentUser, now: float | None = None) -> None:
        current_time = time.time() if now is None else now
        expires_at = current_time + self._ttl_seconds
        jwt_exp = _extract_jwt_exp(user.access_token)
        if jwt_exp is not None:
            expires_at = min(expires_at, jwt_exp)
        if expires_at <= current_time:
            return
        key = self._key(user.access_token)
        with self._lock:
            if len(self._entries) >= self._max_entries:
                expired_keys = [
                    cached_key
                    for cached_key, (cached_exp, _, _) in self._entries.items()
                    if cached_exp <= current_time
                ]
                for cached_key in expired_keys:
                    self._entries.pop(cached_key, None)
                if len(self._entries) >= self._max_entries:
                    self._entries.pop(next(iter(self._entries)))
            self._entries[key] = (expires_at, user.id, user.email)


_shared_token_cache = _VerifiedTokenCache()


class SupabaseTokenVerifier:
    """Valida o token chamando o Supabase Auth (`auth.get_user`) com cache TTL curto."""

    def __init__(
        self,
        anonymous_client: Client,
        cache: _VerifiedTokenCache | None = None,
    ) -> None:
        self._client = anonymous_client
        self._cache = cache

    def verify(self, access_token: str) -> CurrentUser:
        if self._cache is not None:
            cached = self._cache.get(access_token)
            if cached is not None:
                return cached

        try:
            response = self._client.auth.get_user(access_token)
        except AuthRetryableError as exc:
            raise ServiceUnavailableError("Serviço de autenticação indisponível") from exc
        except AuthApiError as exc:
            if exc.status in {400, 401, 403}:
                raise AuthenticationError("Token inválido ou expirado") from exc
            raise ServiceUnavailableError("Serviço de autenticação indisponível") from exc
        except AuthUnknownError as exc:
            raise ServiceUnavailableError("Serviço de autenticação indisponível") from exc
        except Exception as exc:
            # Falhas inesperadas de transporte/SDK não significam que o token é inválido.
            raise ServiceUnavailableError("Serviço de autenticação indisponível") from exc

        user = response.user if response else None
        if user is None:
            raise AuthenticationError("Token inválido ou expirado")

        current_user = CurrentUser(id=UUID(user.id), email=user.email, access_token=access_token)
        if self._cache is not None:
            self._cache.put(current_user)
        return current_user


def get_token_verifier() -> SupabaseTokenVerifier:
    client = get_supabase_client()
    if client is None:
        raise ServiceUnavailableError("Autenticação ainda não está configurada")
    return SupabaseTokenVerifier(client, cache=_shared_token_cache)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> CurrentUser:
    if credentials is None:
        raise AuthenticationError("Token de autenticação ausente")
    # Resolve a infraestrutura somente depois de validar a ausência do header.
    # Sem isso, uma API sem Supabase configurado responderia 503 para uma
    # requisição anônima, escondendo o erro de autenticação do cliente.
    return get_token_verifier().verify(credentials.credentials)


def get_user_scoped_client(
    current_user: CurrentUser = Depends(get_current_user),
) -> Iterator[Client]:
    client = create_user_scoped_client(current_user.access_token)
    try:
        yield client
    finally:
        # Libera conexões/sockets do pool HTTP ao final de cada requisição.
        postgrest = getattr(client, "postgrest", None)
        session = getattr(postgrest, "session", None)
        close = getattr(session, "close", None)
        if callable(close):
            close()
