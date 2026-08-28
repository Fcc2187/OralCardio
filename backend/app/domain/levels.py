from dataclasses import dataclass


@dataclass(frozen=True)
class Level:
    number: int
    name: str
    min_points: int


LEVELS: tuple[Level, ...] = (
    Level(1, "Semente", 0),
    Level(2, "Broto", 250),
    Level(3, "Raiz", 750),
    Level(4, "Flor", 1_875),
    Level(5, "Fruto", 3_750),
    Level(6, "Guardião do Coração", 7_500),
)


def calculate_level(total_points: int) -> Level:
    """Retorna o nível correspondente ao total de pontos.

    Espelha a função `calculate_level` do banco (database/006), que é a fonte
    de verdade quando os pontos são atualizados por trigger (escovação). Esta
    versão em Python é usada quando o backend precisa prever o nível
    resultante antes de persistir (ex: ao desbloquear uma conquista).
    """
    current = LEVELS[0]
    for level in LEVELS:
        if total_points >= level.min_points:
            current = level
        else:
            break
    return current
