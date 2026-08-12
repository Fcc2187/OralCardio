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

    @staticmethod
    def _maybe_single_data(response: object) -> dict | None:
        """Extrai `.data` de uma resposta de `.maybe_single().execute()`.

        Peculiaridade do postgrest-py: quando zero linhas são encontradas,
        `.execute()` retorna `None` diretamente, não um objeto de resposta
        com `.data = None`. Acessar `.data` sem essa checagem lança
        `AttributeError`. Centralizar aqui evita repetir a checagem (e o bug)
        em cada repositório que usa `maybe_single()`.
        """
        return response.data if response is not None else None
