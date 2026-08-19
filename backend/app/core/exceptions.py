class DomainError(Exception):
    """Base para exceções de regra de negócio. Services nunca levantam HTTPException."""


class EntityNotFoundError(DomainError):
    def __init__(self, entity: str, identifier: str | None = None) -> None:
        self.entity = entity
        self.identifier = identifier
        detail = f"{entity} não encontrado" + (f": {identifier}" if identifier else "")
        super().__init__(detail)


class ConflictError(DomainError):
    """Violação de constraint de unicidade ou estado já existente."""


class PermissionDeniedError(DomainError):
    """Usuário autenticado, mas sem permissão para a ação solicitada."""


class BusinessRuleViolationError(DomainError):
    """Ação inválida dado o estado atual do recurso (ex: reabrir sessão concluída)."""


class AuthenticationError(DomainError):
    """Token ausente, inválido ou expirado."""


class ServiceUnavailableError(DomainError):
    """Integração externa necessária ainda não foi configurada ou está indisponível."""
