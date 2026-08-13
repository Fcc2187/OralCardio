from dataclasses import dataclass
from datetime import date, timedelta
from uuid import UUID

import pytest

from app.repositories.records import UserStatsRecord
from app.services.dashboard_service import DashboardService


@dataclass(frozen=True)
class _StubUser:
    full_name: str


@dataclass(frozen=True)
class _StubHealthProfile:
    is_completed: bool


class _StubUserService:
    def __init__(self, user: _StubUser) -> None:
        self._user = user

    def get_profile(self, user_id: UUID) -> _StubUser:
        return self._user


class _StubHealthProfileService:
    def __init__(self, profile: _StubHealthProfile | None) -> None:
        self._profile = profile

    def get_profile(self, user_id: UUID) -> _StubHealthProfile | None:
        return self._profile


class _StubGamificationService:
    def __init__(self, stats: UserStatsRecord) -> None:
        self._stats = stats

    def get_stats(self, user_id: UUID) -> UserStatsRecord:
        return self._stats


def _build_service(
    user_id: UUID,
    *,
    last_brushing_date: date | None,
    last_flossing_date: date | None,
    health_profile: _StubHealthProfile | None = _StubHealthProfile(is_completed=True),
) -> DashboardService:
    stats = UserStatsRecord(
        user_id=user_id,
        total_points=10,
        level=1,
        level_name="Semente",
        current_streak_days=1,
        longest_streak_days=1,
        total_brushings=1,
        total_flossings=1,
        last_brushing_date=last_brushing_date,
        last_flossing_date=last_flossing_date,
    )
    return DashboardService(
        user_service=_StubUserService(_StubUser(full_name="Maria Silva")),
        health_profile_service=_StubHealthProfileService(health_profile),
        gamification_service=_StubGamificationService(stats),
    )


def test_brushed_and_flossed_today_are_true_when_dates_match_today(user_id: UUID) -> None:
    service = _build_service(
        user_id, last_brushing_date=date.today(), last_flossing_date=date.today()
    )

    summary = service.get_summary(user_id)

    assert summary.brushed_today is True
    assert summary.flossed_today is True


def test_brushed_and_flossed_today_are_false_when_dates_are_in_the_past(user_id: UUID) -> None:
    yesterday = date.today() - timedelta(days=1)
    service = _build_service(user_id, last_brushing_date=yesterday, last_flossing_date=yesterday)

    summary = service.get_summary(user_id)

    assert summary.brushed_today is False
    assert summary.flossed_today is False


def test_brushed_and_flossed_today_are_false_when_never_logged(user_id: UUID) -> None:
    service = _build_service(user_id, last_brushing_date=None, last_flossing_date=None)

    summary = service.get_summary(user_id)

    assert summary.brushed_today is False
    assert summary.flossed_today is False


def test_brushed_and_flossed_today_are_independent_of_each_other(user_id: UUID) -> None:
    service = _build_service(user_id, last_brushing_date=date.today(), last_flossing_date=None)

    summary = service.get_summary(user_id)

    assert summary.brushed_today is True
    assert summary.flossed_today is False


@pytest.mark.parametrize(
    ("health_profile", "expected"),
    [
        (None, False),
        (_StubHealthProfile(is_completed=False), False),
        (_StubHealthProfile(is_completed=True), True),
    ],
)
def test_health_profile_completed_reflects_the_profile_state(
    user_id: UUID, health_profile: _StubHealthProfile | None, expected: bool
) -> None:
    service = _build_service(
        user_id,
        last_brushing_date=None,
        last_flossing_date=None,
        health_profile=health_profile,
    )

    summary = service.get_summary(user_id)

    assert summary.health_profile_completed is expected
