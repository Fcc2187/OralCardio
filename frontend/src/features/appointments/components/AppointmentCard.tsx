import { Link } from "react-router-dom";

import type { Appointment } from "../types";
import { AppointmentSummary } from "./AppointmentSummary";

interface AppointmentCardProps {
  appointment: Appointment;
  nowMs?: number;
}

function notInformedOr(value: string | null): string | null {
  return value && value.trim().length > 0 ? value : null;
}

export function AppointmentCard({ appointment, nowMs = Date.now() }: AppointmentCardProps) {
  const clinicPhone = notInformedOr(appointment.clinic_phone);

  return (
    // O link "tel:" abaixo é um irmão do Link, nunca aninhado dentro dele —
    // <a> dentro de <a> é HTML inválido e quebra o foco de teclado.
    <div className="flex flex-col gap-xs rounded-lg border border-hairline bg-canvas p-md">
      <Link to={`/agenda/${appointment.id}`} className="flex flex-col gap-xs">
        <AppointmentSummary appointment={appointment} nowMs={nowMs} />
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
