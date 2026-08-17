from datetime import UTC, datetime

import pytest

from app.core.clock import sao_paulo_date


def test_utc_time_before_sao_paulo_midnight_belongs_to_previous_day() -> None:
    assert sao_paulo_date(datetime(2026, 8, 18, 2, 59, tzinfo=UTC)).isoformat() == "2026-08-17"


def test_utc_time_at_sao_paulo_midnight_belongs_to_new_day() -> None:
    assert sao_paulo_date(datetime(2026, 8, 18, 3, 0, tzinfo=UTC)).isoformat() == "2026-08-18"


def test_business_date_rejects_naive_datetime() -> None:
    with pytest.raises(ValueError, match="fuso horário"):
        sao_paulo_date(datetime(2026, 8, 18, 3, 0))
