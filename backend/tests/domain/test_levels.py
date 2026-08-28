import pytest

from app.domain.levels import calculate_level


@pytest.mark.parametrize(
    ("points", "expected_number", "expected_name"),
    [
        (0, 1, "Semente"),
        (249, 1, "Semente"),
        (250, 2, "Broto"),
        (749, 2, "Broto"),
        (750, 3, "Raiz"),
        (1_874, 3, "Raiz"),
        (1_875, 4, "Flor"),
        (3_749, 4, "Flor"),
        (3_750, 5, "Fruto"),
        (7_499, 5, "Fruto"),
        (7_500, 6, "Guardião do Coração"),
        (10_000, 6, "Guardião do Coração"),
    ],
)
def test_calculate_level_boundaries(points: int, expected_number: int, expected_name: str) -> None:
    level = calculate_level(points)

    assert level.number == expected_number
    assert level.name == expected_name
