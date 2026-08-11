"""Conversão de valores vindos do PostgREST.

O PostgREST serializa toda coluna `date`/`timestamptz` como string ISO 8601 no
JSON de resposta — não existe tipo de data nativo em JSON. Sem essa conversão
explícita, os records internos acabariam guardando strings em campos tipados
como `date`/`datetime`, e qualquer aritmética de data no domínio (duração de
uma sessão, "escovou hoje?") quebraria silenciosamente ou lançaria erro.
"""

from datetime import date, datetime


def parse_datetime(value: str | None) -> datetime | None:
    if value is None:
        return None
    return datetime.fromisoformat(value)


def parse_required_datetime(value: str) -> datetime:
    return datetime.fromisoformat(value)


def parse_date(value: str | None) -> date | None:
    if value is None:
        return None
    return date.fromisoformat(value)
