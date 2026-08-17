from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.schemas.gamification import AchievementRevealAcknowledgeInput


def test_acknowledge_accepts_one_achievement_id() -> None:
    achievement_id = uuid4()
    payload = AchievementRevealAcknowledgeInput(achievement_ids=[achievement_id])
    assert payload.achievement_ids == [achievement_id]


def test_acknowledge_accepts_up_to_one_hundred_ids() -> None:
    payload = AchievementRevealAcknowledgeInput(achievement_ids=[uuid4() for _ in range(100)])
    assert len(payload.achievement_ids) == 100


def test_acknowledge_rejects_empty_list() -> None:
    with pytest.raises(ValidationError):
        AchievementRevealAcknowledgeInput(achievement_ids=[])


def test_acknowledge_rejects_more_than_one_hundred_ids() -> None:
    with pytest.raises(ValidationError):
        AchievementRevealAcknowledgeInput(achievement_ids=[uuid4() for _ in range(101)])
