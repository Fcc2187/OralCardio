import type { Appointment } from "./types";

export interface GroupedAppointments {
  /** Passadas mas ainda `scheduled` — o estado mais comum na prática,
   * porque ninguém lembra de marcar uma consulta como concluída. */
  overdue: Appointment[];
  upcoming: Appointment[];
  past: Appointment[];
}

/** `GET /appointments` devolve tudo em `scheduled_at` DESC. "Próximas"
 * precisa ser ascendente (mais próxima primeiro) — por isso reordenamos
 * aqui em vez de confiar na ordem que chega da API. */
export function groupAppointments(items: Appointment[], nowMs: number): GroupedAppointments {
  const overdue: Appointment[] = [];
  const upcoming: Appointment[] = [];
  const past: Appointment[] = [];

  for (const appointment of items) {
    const scheduledAtMs = new Date(appointment.scheduled_at).getTime();
    const isFuture = scheduledAtMs > nowMs;

    if (appointment.status === "scheduled" && !isFuture) {
      overdue.push(appointment);
    } else if (isFuture && (appointment.status === "scheduled" || appointment.status === "rescheduled")) {
      upcoming.push(appointment);
    } else {
      past.push(appointment);
    }
  }

  upcoming.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  past.sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
  overdue.sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

  return { overdue, upcoming, past };
}
