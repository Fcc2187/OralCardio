from app.domain.enums import BrushingZone

ALL_ZONES: frozenset[BrushingZone] = frozenset(BrushingZone)


def is_session_complete(zones_completed: set[BrushingZone]) -> bool:
    """Uma sessão só é considerada completa quando as 5 zonas foram marcadas."""
    return ALL_ZONES.issubset(zones_completed)


def validate_zone_transition(
    current_zones: set[BrushingZone], new_zone: BrushingZone
) -> set[BrushingZone]:
    """Retorna o novo conjunto de zonas concluídas, adicionando `new_zone`.

    Marcar a mesma zona duas vezes é idempotente (não é erro), pois o timer no
    cliente pode reenviar o mesmo evento em caso de retry de rede.
    """
    return current_zones | {new_zone}
