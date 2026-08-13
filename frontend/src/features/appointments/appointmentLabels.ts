import type { AppointmentStatus, AppointmentType } from "./types";

export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  routine_checkup: "Exame de rotina",
  cleaning: "Limpeza",
  emergency: "Emergência",
  follow_up: "Retorno",
  procedure: "Procedimento",
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: "Agendada",
  completed: "Concluída",
  cancelled: "Cancelada",
  rescheduled: "Remarcada",
};
