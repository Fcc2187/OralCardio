from app.domain.brushing import is_session_complete, validate_zone_transition
from app.domain.enums import BrushingZone


def test_session_is_not_complete_with_partial_zones() -> None:
    zones = {BrushingZone.UPPER_RIGHT, BrushingZone.UPPER_LEFT}

    assert is_session_complete(zones) is False


def test_session_is_complete_with_all_five_zones() -> None:
    zones = set(BrushingZone)

    assert is_session_complete(zones) is True


def test_validate_zone_transition_adds_new_zone() -> None:
    current = {BrushingZone.UPPER_RIGHT}

    updated = validate_zone_transition(current, BrushingZone.TONGUE)

    assert updated == {BrushingZone.UPPER_RIGHT, BrushingZone.TONGUE}


def test_validate_zone_transition_is_idempotent_for_repeated_zone() -> None:
    current = {BrushingZone.UPPER_RIGHT}

    updated = validate_zone_transition(current, BrushingZone.UPPER_RIGHT)

    assert updated == {BrushingZone.UPPER_RIGHT}
