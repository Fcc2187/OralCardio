"""Validação de par de chaves VAPID antes de iniciar o worker."""

from __future__ import annotations

import base64
from pathlib import Path

from cryptography.hazmat.primitives import serialization


def validate_vapid_configuration(public_key: str, private_key: str, subject: str) -> None:
    """Garante que a chave pública Web Push corresponde à chave privada PEM.

    A biblioteca de push aceita uma rota para o PEM. Validar no boot evita
    aceitar uma configuração placeholder e descobrir o erro no primeiro envio.
    """

    if not subject.startswith("mailto:") or "@" not in subject.removeprefix("mailto:"):
        raise ValueError("WEB_PUSH_VAPID_SUBJECT deve ser um e-mail mailto válido")

    try:
        padded_key = public_key + "=" * (-len(public_key) % 4)
        public_bytes = base64.urlsafe_b64decode(padded_key.encode("ascii"))
    except (UnicodeEncodeError, ValueError) as exc:
        raise ValueError("WEB_PUSH_VAPID_PUBLIC_KEY não é Base64URL válido") from exc
    if len(public_bytes) != 65 or public_bytes[0] != 4:
        raise ValueError("WEB_PUSH_VAPID_PUBLIC_KEY deve ser uma chave P-256 não comprimida")

    private_pem = _load_private_pem(private_key)
    try:
        loaded_private_key = serialization.load_pem_private_key(private_pem, password=None)
        derived_public_key = loaded_private_key.public_key().public_bytes(
            serialization.Encoding.X962,
            serialization.PublicFormat.UncompressedPoint,
        )
    except (TypeError, ValueError) as exc:
        raise ValueError("WEB_PUSH_VAPID_PRIVATE_KEY não contém uma chave PEM válida") from exc
    if derived_public_key != public_bytes:
        raise ValueError("As chaves VAPID pública e privada não formam um par")


def _load_private_pem(value: str) -> bytes:
    normalized_value = value.strip().replace("\\n", "\n")
    if "-----BEGIN" in normalized_value:
        return f"{normalized_value}\n".encode()
    try:
        return Path(value).read_bytes()
    except OSError:
        raise ValueError(
            "WEB_PUSH_VAPID_PRIVATE_KEY deve apontar para um arquivo PEM legível"
        ) from None
