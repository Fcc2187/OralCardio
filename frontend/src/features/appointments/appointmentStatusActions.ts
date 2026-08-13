import type { AppointmentStatus } from "./types";

export interface AppointmentAction {
  status: AppointmentStatus;
  label: string;
}

// Espelho fiel de app/domain/appointments.py::_ALLOWED_TRANSITIONS:
//   scheduled   -> completed | cancelled | rescheduled
//   rescheduled -> scheduled
//   completed   -> (terminal)
//   cancelled   -> (terminal)
const ALLOWED_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  scheduled: ["completed", "cancelled", "rescheduled"],
  rescheduled: ["scheduled"],
  completed: [],
  cancelled: [],
};

const ACTION_LABELS: Record<AppointmentStatus, string> = {
  completed: "Marcar como concluída",
  cancelled: "Cancelar consulta",
  rescheduled: "Marcar como remarcada",
  scheduled: "Confirmar novo horário",
};

export function availableStatusActions(status: AppointmentStatus): AppointmentAction[] {
  return ALLOWED_TRANSITIONS[status].map((target) => ({
    status: target,
    label: ACTION_LABELS[target],
  }));
}

export function isTerminal(status: AppointmentStatus): boolean {
  return ALLOWED_TRANSITIONS[status].length === 0;
}

export function canEdit(status: AppointmentStatus): boolean {
  return !isTerminal(status);
}
