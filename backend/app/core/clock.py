from datetime import UTC, date, datetime
from typing import Protocol
from zoneinfo import ZoneInfo

_BUSINESS_TIME_ZONE = ZoneInfo("America/Sao_Paulo")


class BusinessClock(Protocol):
    def today(self) -> date: ...


class InstantClock(Protocol):
    def now(self) -> datetime: ...


def sao_paulo_date(instant: datetime) -> date:
    if instant.tzinfo is None:
        raise ValueError("O instante precisa conter fuso horário")
    return instant.astimezone(_BUSINESS_TIME_ZONE).date()


class SaoPauloBusinessClock:
    """Relógio de negócio explícito para não depender do fuso do processo."""

    def today(self) -> date:
        return sao_paulo_date(datetime.now(UTC))


class UtcClock:
    def now(self) -> datetime:
        return datetime.now(UTC)
