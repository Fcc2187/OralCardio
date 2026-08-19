import base64
import binascii
from dataclasses import dataclass
from datetime import time
from urllib.parse import urlparse

from cryptography.hazmat.primitives.asymmetric import ec

from app.core.exceptions import BusinessRuleViolationError

ALLOWED_APPOINTMENT_LEADS = frozenset({15, 30, 60, 120, 360, 720, 1440, 2880, 10080})
_PUSH_SERVICE_HOSTS = frozenset(
    {
        "fcm.googleapis.com",
        "updates.push.services.mozilla.com",
        "web.push.apple.com",
    }
)


@dataclass(frozen=True)
class NotificationPreferencesUpdate:
    enabled: bool
    brushing_enabled: bool
    brushing_times: tuple[time, ...]
    flossing_enabled: bool
    flossing_time: time
    appointments_enabled: bool
    appointment_lead_minutes: tuple[int, ...]
    quiet_hours_start: time
    quiet_hours_end: time


def is_quiet_time(value: time, start: time, end: time) -> bool:
    if start < end:
        return start <= value < end
    return value >= start or value < end


def validate_notification_preferences(value: NotificationPreferencesUpdate) -> None:
    if not 1 <= len(value.brushing_times) <= 5:
        raise BusinessRuleViolationError(
            "Configure entre um e cinco lembretes de escovação"
        )
    if len(set(value.brushing_times)) != len(value.brushing_times):
        raise BusinessRuleViolationError("Os horários de escovação não podem se repetir")
    if value.quiet_hours_start == value.quiet_hours_end:
        raise BusinessRuleViolationError(
            "O início e o fim do horário silencioso devem ser diferentes"
        )
    if any(
        is_quiet_time(reminder_time, value.quiet_hours_start, value.quiet_hours_end)
        for reminder_time in (*value.brushing_times, value.flossing_time)
    ):
        raise BusinessRuleViolationError(
            "Lembretes de hábitos não podem ficar dentro do horário silencioso"
        )
    leads = value.appointment_lead_minutes
    if not 1 <= len(leads) <= 3 or len(set(leads)) != len(leads):
        raise BusinessRuleViolationError(
            "Configure entre uma e três antecedências de consulta sem repetições"
        )
    if not set(leads).issubset(ALLOWED_APPOINTMENT_LEADS):
        raise BusinessRuleViolationError("Antecedência de consulta inválida")


def retry_delay_seconds(attempt_count: int, delivery_identity: int) -> int:
    """Backoff exponencial com jitter determinístico e testável."""
    base = min(3600, 60 * (2 ** max(0, attempt_count)))
    return base + delivery_identity % 31


def validate_push_endpoint(endpoint: str) -> None:
    try:
        parsed = urlparse(endpoint)
        port = parsed.port
    except ValueError as exc:
        raise BusinessRuleViolationError("Endpoint de notificação inválido") from exc
    hostname = (parsed.hostname or "").lower()
    is_windows_push = hostname.endswith(".notify.windows.com")
    if (
        parsed.scheme != "https"
        or parsed.username is not None
        or parsed.password is not None
        or port not in (None, 443)
        or (hostname not in _PUSH_SERVICE_HOSTS and not is_windows_push)
    ):
        raise BusinessRuleViolationError("Endpoint de notificação inválido")


def validate_push_subscription_keys(p256dh: str, auth_secret: str) -> None:
    try:
        public_key = _decode_base64url(p256dh)
        auth = _decode_base64url(auth_secret)
        if len(public_key) != 65 or public_key[0] != 4 or len(auth) != 16:
            raise ValueError
        ec.EllipticCurvePublicKey.from_encoded_point(ec.SECP256R1(), public_key)
    except (binascii.Error, ValueError):
        raise BusinessRuleViolationError(
            "Chaves da inscrição de notificação inválidas"
        ) from None


def _decode_base64url(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.b64decode(value + padding, altchars=b"-_", validate=True)
