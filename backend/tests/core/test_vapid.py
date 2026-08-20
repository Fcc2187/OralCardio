import base64

import pytest
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.serialization import (
    Encoding,
    NoEncryption,
    PrivateFormat,
    PublicFormat,
)

from app.core.vapid import validate_vapid_configuration


def _key_pair() -> tuple[str, str]:
    private_key = ec.generate_private_key(ec.SECP256R1())
    public_bytes = private_key.public_key().public_bytes(
        Encoding.X962, PublicFormat.UncompressedPoint
    )
    public_key = base64.urlsafe_b64encode(public_bytes).rstrip(b"=").decode("ascii")
    private_pem = private_key.private_bytes(
        Encoding.PEM, PrivateFormat.PKCS8, NoEncryption()
    ).decode("ascii")
    return public_key, private_pem


def test_validate_vapid_configuration_accepts_matching_pair() -> None:
    public_key, private_pem = _key_pair()

    validate_vapid_configuration(public_key, private_pem, "mailto:ops@example.com")


def test_validate_vapid_configuration_accepts_escaped_pem_newlines() -> None:
    public_key, private_pem = _key_pair()

    validate_vapid_configuration(
        public_key,
        private_pem.strip().replace("\n", "\\n"),
        "mailto:ops@example.com",
    )


def test_validate_vapid_configuration_rejects_mismatched_pair() -> None:
    public_key, _ = _key_pair()
    _, private_pem = _key_pair()

    with pytest.raises(ValueError, match="não formam um par"):
        validate_vapid_configuration(public_key, private_pem, "mailto:ops@example.com")


def test_invalid_private_key_does_not_leak_value_in_chained_error() -> None:
    public_key, _ = _key_pair()
    exposed_value = "sensitive-private-key-material"

    with pytest.raises(ValueError) as exc_info:
        validate_vapid_configuration(
            public_key,
            exposed_value,
            "mailto:ops@example.com",
        )

    assert exposed_value not in str(exc_info.value)
    assert exc_info.value.__suppress_context__ is True
