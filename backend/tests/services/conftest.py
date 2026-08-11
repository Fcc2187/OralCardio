from uuid import UUID, uuid4

import pytest

from app.repositories.records import UserStatsRecord


@pytest.fixture
def user_id() -> UUID:
    return uuid4()


@pytest.fixture
def empty_stats(user_id: UUID) -> UserStatsRecord:
    return UserStatsRecord(
        user_id=user_id,
        total_points=0,
        level=1,
        level_name="Semente",
        current_streak_days=0,
        longest_streak_days=0,
        total_brushings=0,
        total_flossings=0,
        last_brushing_date=None,
        last_flossing_date=None,
    )
