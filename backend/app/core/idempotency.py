"""Funções determinísticas para proteger replays de mutações HTTP."""

from __future__ import annotations

import hashlib
import json
from typing import Any


def request_fingerprint(payload: dict[str, Any]) -> str:
    """Retorna SHA-256 canônico do corpo lógico da requisição.

    A chave de idempotência identifica a intenção do cliente; este fingerprint
    impede que a mesma chave seja reutilizada acidentalmente para outro corpo.
    """

    serialized = json.dumps(
        payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False
    )
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()
