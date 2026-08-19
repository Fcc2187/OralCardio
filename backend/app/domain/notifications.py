from dataclasses import dataclass
from datetime import time

from app.core.exceptions import BusinessRuleViolationError

ALLOWED_APPOINTMENT_LEADS = frozenset({15, 30, 60, 120, 360, 720, 1440, 2880, 10080})


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
