from collections.abc import Callable
from typing import TypeVar

from postgrest.exceptions import APIError
from supabase import Client

from app.core.exceptions import ConflictError, EntityNotFoundError

T = TypeVar("T")

_UNIQUE_VIOLATION = "23505"
_NOT_FOUND = "PGRST116"


class SupabaseRepository:
    """Base para repositórios: fornece o client escopado ao usuário e traduz
    erros do PostgREST em exceções de domínio, para que os repositórios
    concretos fiquem livres de tratamento de erro repetitivo.
    """

    def __init__(self, client: Client) -> None:
        self._client = client

    def _run(self, entity: str, operation: Callable[[], T]) -> T:
        try:
            return operation()
        except APIError as exc:
            if exc.code == _UNIQUE_VIOLATION:
                raise ConflictError(f"{entity} já existe") from exc
            if exc.code == _NOT_FOUND:
                raise EntityNotFoundError(entity) from exc
            raise
