from typing import Protocol


class HealthRepository(Protocol):
    """Contrato para verificação de disponibilidade da fonte de dados."""

    def ping(self) -> bool:
        """Retorna True se a conexão com o banco de dados está saudável."""
        ...