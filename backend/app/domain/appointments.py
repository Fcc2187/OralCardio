from app.core.exceptions import BusinessRuleViolationError
from app.domain.enums import AppointmentStatus

_ALLOWED_TRANSITIONS: dict[AppointmentStatus, frozenset[AppointmentStatus]] = {
    AppointmentStatus.SCHEDULED: frozenset(
        {
            AppointmentStatus.COMPLETED,
            AppointmentStatus.CANCELLED,
            AppointmentStatus.RESCHEDULED,
        }
    ),
    AppointmentStatus.RESCHEDULED: frozenset({AppointmentStatus.SCHEDULED}),
    AppointmentStatus.COMPLETED: frozenset(),
    AppointmentStatus.CANCELLED: frozenset(),
}


def validate_status_transition(current: AppointmentStatus, new: AppointmentStatus) -> None:
    """Valida o ciclo de vida da consulta (seção 3.4 da documentação):

    scheduled -> completed | cancelled | rescheduled
    rescheduled -> scheduled (novo ciclo)

    `completed` e `cancelled` são terminais. Repetir o status atual é
    idempotente (não é erro), para suportar retry de rede no cliente.
    """
    if current == new:
        return

    if new not in _ALLOWED_TRANSITIONS[current]:
        raise BusinessRuleViolationError(
            f"Transição de status inválida: {current.value} → {new.value}"
        )
