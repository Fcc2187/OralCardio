from datetime import time

import pytest

from app.core.exceptions import BusinessRuleViolationError
from app.domain.notifications import (
    NotificationPreferencesUpdate,
    is_quiet_time,
    retry_delay_seconds,
    validate_notification_preferences,
    validate_push_endpoint,
    validate_push_subscription_keys,
)


def valid_preferences(**overrides) -> NotificationPreferencesUpdate:
    values = {
        "enabled": True,
        "brushing_enabled": True,
        "brushing_times": (time(8), time(20)),
        "flossing_enabled": True,
        "flossing_time": time(21),
        "appointments_enabled": True,
        "appointment_lead_minutes": (1440, 120),
        "quiet_hours_start": time(22),
        "quiet_hours_end": time(7),
    }
    values.update(overrides)
    return NotificationPreferencesUpdate(**values)


def test_valid_notification_preferences_are_accepted() -> None:
    validate_notification_preferences(valid_preferences())


@pytest.mark.parametrize("value", [time(22), time(23, 59), time(0), time(6, 59)])
def test_quiet_time_handles_period_across_midnight(value: time) -> None:
    assert is_quiet_time(value, time(22), time(7))


@pytest.mark.parametrize("value", [time(7), time(8), time(21, 59)])
def test_time_outside_quiet_period_is_not_quiet(value: time) -> None:
    assert not is_quiet_time(value, time(22), time(7))


def test_duplicate_brushing_times_are_rejected() -> None:
    with pytest.raises(BusinessRuleViolationError, match="não podem se repetir"):
        validate_notification_preferences(
            valid_preferences(brushing_times=(time(8), time(8)))
        )


def test_habit_reminder_inside_quiet_hours_is_rejected() -> None:
    with pytest.raises(BusinessRuleViolationError, match="horário silencioso"):
        validate_notification_preferences(valid_preferences(flossing_time=time(23)))


def test_unknown_appointment_lead_is_rejected() -> None:
    with pytest.raises(BusinessRuleViolationError, match="Antecedência"):
        validate_notification_preferences(
            valid_preferences(appointment_lead_minutes=(999,))
        )


def test_retry_delay_is_exponential_capped_and_jittered() -> None:
    assert retry_delay_seconds(0, 5) == 65
    assert retry_delay_seconds(1, 5) == 125
    assert retry_delay_seconds(20, 5) == 3605


@pytest.mark.parametrize(
    "endpoint",
    [
        "http://fcm.googleapis.com/subscription",
        "https://user:password@fcm.googleapis.com/subscription",
        "https://internal.example/subscription",
        "https://fcm.googleapis.com:invalid/subscription",
    ],
)
def test_push_endpoint_rejects_non_provider_or_malformed_urls(endpoint: str) -> None:
    with pytest.raises(BusinessRuleViolationError):
        validate_push_endpoint(endpoint)


def test_push_subscription_rejects_malformed_base64_keys() -> None:
    with pytest.raises(BusinessRuleViolationError):
        validate_push_subscription_keys("not-base64!", "also-invalid!")
