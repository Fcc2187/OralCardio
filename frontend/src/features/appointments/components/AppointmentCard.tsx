import { Calendar, CalendarCheck, ChevronRight, Phone, User } from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "@/shared/utils/cn";
import { calendarDayDelta, formatDateLong, formatTime, relativeDayLabel } from "@/shared/utils/formatDate";

import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_TYPE_LABELS } from "../appointmentLabels";
import type { Appointment } from "../types";

interface AppointmentCardProps {
  appointment: Appointment;
  nowMs?: number;
}

function notInformedOr(value: string | null): string | null {
  return value && value.trim().length > 0 ? value : null;
}

export function AppointmentCard({ appointment, nowMs = Date.now() }: AppointmentCardProps) {
  const clinicPhone = notInformedOr(appointment.clinic_phone);
  const scheduledAtMs = new Date(appointment.scheduled_at).getTime();
  const dayDelta = calendarDayDelta(nowMs, scheduledAtMs);
  const isScheduled = appointment.status === "scheduled";

  const dateFormatted = formatDateLong(appointment.scheduled_at);
  const timeFormatted = formatTime(appointment.scheduled_at);

  return (
    // O link "tel:" abaixo é um irmão do Link, nunca aninhado dentro dele —
    // <a> dentro de <a> é HTML inválido e quebra o foco de teclado.
    <article className="flex flex-col gap-3.5 rounded-2xl border border-hairline-soft/80 bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] transition-shadow hover:shadow-[0_6px_28px_rgba(0,0,0,0.06)] min-[640px]:gap-4 min-[640px]:p-6">
      {/* Top row: Relative Day Pill & Status Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 rounded-pill bg-surface-soft px-3 py-1 font-body text-caption font-medium text-body">
          <Calendar aria-hidden="true" className="size-3.5 text-muted" />
          <span>{relativeDayLabel(dayDelta)}</span>
        </div>

        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-pill px-3 py-1 font-body text-badge font-medium shadow-xs",
            isScheduled
              ? "bg-primary-action text-white"
              : "bg-surface-soft text-body-strong",
          )}
        >
          {isScheduled ? (
            <CalendarCheck aria-hidden="true" className="size-3.5" />
          ) : (
            <Calendar aria-hidden="true" className="size-3.5" />
          )}
          <span>{APPOINTMENT_STATUS_LABELS[appointment.status]}</span>
        </span>
      </div>

      {/* Main row: Big Calendar Icon Tile + Formatted Date and Time */}
      <Link
        to={`/agenda/${appointment.id}`}
        className="group/date flex items-center gap-3.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary-action focus-visible:ring-offset-2 min-[640px]:gap-4"
      >
        <div
          aria-hidden="true"
          className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-primary-action/20 bg-primary-action/10 text-primary-action min-[640px]:size-16"
        >
          <Calendar className="size-6 min-[640px]:size-7" />
        </div>
        <p className="font-display text-title-md leading-snug text-ink transition-colors group-hover/date:text-primary-action min-[640px]:text-title-lg">
          {dateFormatted} às{" "}
          <span className="font-normal text-primary-action">{timeFormatted}</span>
        </p>
      </Link>

      <hr className="border-0 border-t border-hairline-soft" />

      {/* Row: Consultation Type & Dentist Name */}
      <div className="flex items-center gap-3">
        <div
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-action/10 text-primary-action"
        >
          <User className="size-4.5" />
        </div>
        <p className="font-body text-body-sm text-body">
          {APPOINTMENT_TYPE_LABELS[appointment.appointment_type]} · {appointment.dentist_name}
        </p>
      </div>

      {/* Row: Phone & Action Arrow */}
      <>
        <hr className="border-0 border-t border-hairline-soft" />
        <div className="flex items-center justify-between gap-3">
          {clinicPhone ? (
            <div className="flex items-center gap-3">
              <div
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-action/10 text-primary-action"
              >
                <Phone className="size-4.5" />
              </div>
              <a
                href={`tel:${clinicPhone.replace(/\D/g, "")}`}
                className="font-body text-body-sm font-medium text-primary-action hover:underline"
              >
                {clinicPhone}
              </a>
            </div>
          ) : (
            <div />
          )}

          <Link
            to={`/agenda/${appointment.id}`}
            aria-label={`Ver detalhes da consulta de ${dateFormatted}`}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-action/10 text-primary-action transition-all hover:bg-primary-action hover:text-white"
          >
            <ChevronRight aria-hidden="true" className="size-4.5" />
          </Link>
        </div>
      </>
    </article>
  );
}
