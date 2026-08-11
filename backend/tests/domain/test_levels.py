import pytest

from app.domain.levels import calculate_level


@pytest.mark.parametrize(
    ("points", "expected_number", "expected_name"),
    [
        (0, 1, "Semente"),
        (19, 1, "Semente"),
        (20, 2, "Broto"),
        (49, 2, "Broto"),
        (50, 3, "Raiz"),
        (99, 3, "Raiz"),
        (100, 4, "Flor"),
        (249, 4, "Flor"),
        (250, 5, "Fruto"),
        (499, 5, "Fruto"),
        (500, 6, "Guardião do Coração"),
        (10_000, 6, "Guardião do Coração"),
    ],
)
def test_calculate_level_boundaries(points: int, expected_number: int, expected_name: str) -> None:
    level = calculate_level(points)

    assert level.number == expected_number
    assert level.name == expected_name
