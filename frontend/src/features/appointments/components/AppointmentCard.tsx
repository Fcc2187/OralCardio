import { Link } from "react-router-dom";

import { Badge } from "@/shared/components/ui/Badge";
import { calendarDayDelta, formatDateTimeLong, relativeDayLabel } from "@/shared/utils/formatDate";

import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_TYPE_LABELS } from "../appointmentLabels";
import type { Appointment, AppointmentStatus } from "../types";

interface AppointmentCardProps {
  appointment: Appointment;
  nowMs?: number;
}

const STATUS_BADGE_VARIANT: Record<AppointmentStatus, "neutral" | "coral"> = {
  scheduled: "coral",
  completed: "neutral",
  cancelled: "neutral",
  rescheduled: "neutral",
};

function notInformedOr(value: string | null): string | null {
  return value && value.trim().length > 0 ? value : null;
}

export function AppointmentCard({ appointment, nowMs = Date.now() }: AppointmentCardProps) {
  const clinicPhone = notInformedOr(appointment.clinic_phone);
  const scheduledAtMs = new Date(appointment.scheduled_at).getTime();
  const dayDelta = calendarDayDelta(nowMs, scheduledAtMs);

  return (
    // O link "tel:" abaixo é um irmão do Link, nunca aninhado dentro dele —
    // <a> dentro de <a> é HTML inválido e quebra o foco de teclado.
    <div className="flex flex-col gap-xs rounded-lg border border-hairline bg-canvas p-md">
      <Link to={`/agenda/${appointment.id}`} className="flex flex-col gap-xs">
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
      </Link>
      {clinicPhone ? (
        <a
          href={`tel:${clinicPhone.replace(/\D/g, "")}`}
          className="w-fit font-body text-body-sm text-primary-action"
        >
          {clinicPhone}
        </a>
      ) : null}
    </div>
  );
}
