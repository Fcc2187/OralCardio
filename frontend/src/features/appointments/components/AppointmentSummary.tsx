import { Badge } from "@/shared/components/ui/Badge";
import { calendarDayDelta, formatDateTimeLong, relativeDayLabel } from "@/shared/utils/formatDate";

import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_TYPE_LABELS } from "../appointmentLabels";
import type { Appointment, AppointmentStatus } from "../types";

interface AppointmentSummaryProps {
  appointment: Appointment;
  nowMs?: number;
}

const STATUS_BADGE_VARIANT: Record<AppointmentStatus, "neutral" | "coral"> = {
  scheduled: "coral",
  completed: "neutral",
  cancelled: "neutral",
  rescheduled: "neutral",
};

/** Só apresentação — usada dentro de um `<Link>` na agenda do paciente e,
 * sem link nenhum, no painel do cuidador (que nunca deve navegar para a
 * rota de detalhe de consulta do próprio cuidador). */
export function AppointmentSummary({ appointment, nowMs = Date.now() }: AppointmentSummaryProps) {
  const scheduledAtMs = new Date(appointment.scheduled_at).getTime();
  const dayDelta = calendarDayDelta(nowMs, scheduledAtMs);

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="font-body text-caption text-muted">{relativeDayLabel(dayDelta)}</p>
        <Badge variant={STATUS_BADGE_VARIANT[appointment.status]}>
          {APPOINTMENT_STATUS_LABELS[appointment.status]}
        </Badge>
      </div>
      <p className="font-display text-title-md">{formatDateTimeLong(appointment.scheduled_at)}</p>
      <p className="font-body text-body-sm text-body">
        {APPOINTMENT_TYPE_LABELS[appointment.appointment_type]} · {appointment.dentist_name}
      </p>
    </>
  );
}
