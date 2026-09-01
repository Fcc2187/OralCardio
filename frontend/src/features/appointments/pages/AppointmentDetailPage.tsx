import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  FileText,
  MapPin,
  Pencil,
  Phone,
  Trash2,
  User,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";

import { HttpError } from "@/shared/api/httpClient";
import { appointmentQueryKey, appointmentsListQueryKey } from "@/shared/api/queryKeys";
import { ConfirmAction } from "@/shared/components/ui/ConfirmAction";
import { ErrorFeedback, LoadingFeedback } from "@/shared/components/ui/Feedback";
import { Screen } from "@/shared/components/layout/Screen";
import { cn } from "@/shared/utils/cn";
import { formatDateLong, formatTime } from "@/shared/utils/formatDate";

import { patchAppointment } from "../api/appointmentsApi";
import { useAppointmentQuery } from "../api/useAppointmentQueries";
import { translateAppointmentError } from "../appointmentErrorMessages";
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_TYPE_LABELS } from "../appointmentLabels";
import { availableStatusActions, canEdit } from "../appointmentStatusActions";
import type { AppointmentStatus } from "../types";

// A agenda desta fatia cobre só concluir/cancelar — "rescheduled" existe no
// espelho de transições (appointmentStatusActions) para casar com o backend,
// mas não vira botão aqui.
const VISIBLE_ACTION_TARGETS = new Set<AppointmentStatus>(["completed", "cancelled"]);

export function AppointmentDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const query = useAppointmentQuery(id);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const statusMutation = useMutation({
    mutationFn: (status: AppointmentStatus) => patchAppointment(id, { status }),
    onSuccess: (updated) => {
      queryClient.setQueryData(appointmentQueryKey(id), updated);
      queryClient.invalidateQueries({ queryKey: appointmentsListQueryKey });
    },
  });

  useEffect(() => {
    if (!query.isPending && !query.isError) {
      headingRef.current?.focus();
    }
  }, [query.isPending, query.isError]);

  if (query.isPending) {
    return <LoadingFeedback message="Carregando a consulta…" />;
  }

  if (query.isError) {
    const isNotFound = query.error instanceof HttpError && query.error.status === 404;
    return (
      <Screen title="Consulta não encontrada" maxWidth="wide" backTo="/agenda" backLabel="Agenda">
        <ErrorFeedback
          message={
            isNotFound
              ? "Consulta não encontrada."
              : "Não foi possível carregar a consulta. Tente novamente em instantes."
          }
        />
      </Screen>
    );
  }

  const appointment = query.data;
  const isScheduled = appointment.status === "scheduled";
  const actions = availableStatusActions(appointment.status).filter((action) =>
    VISIBLE_ACTION_TARGETS.has(action.status),
  );

  const dateFormatted = formatDateLong(appointment.scheduled_at);
  const timeFormatted = formatTime(appointment.scheduled_at);

  return (
    <Screen title="Consulta" maxWidth="wide" hideHeader className="relative">
      {/* Back Link */}
      <Link
        to="/agenda"
        className="inline-flex min-h-tap-target-min w-fit items-center gap-1 font-body text-body-sm font-medium text-primary-action transition-colors hover:underline"
      >
        <ChevronLeft className="size-4" />
        <span>Agenda</span>
      </Link>

      {/* Editorial Header */}
      <header className="flex flex-col">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-[2.2rem] font-normal leading-tight text-ink outline-none min-[640px]:text-[2.6rem]"
        >
          Consulta
        </h1>
        <div className="mt-2 flex items-center gap-1.5 text-primary-action" aria-hidden="true">
          <span className="h-px w-20 bg-primary-action/40 min-[640px]:w-28" />
          <svg className="size-2.5 fill-primary-action" viewBox="0 0 24 24">
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
          </svg>
        </div>
      </header>

      {/* Responsive Grid: Left Card, Right Action Buttons */}
      <div className="grid grid-cols-1 gap-6 min-[1024px]:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)] min-[1024px]:items-start min-[1024px]:gap-8">
        {/* Main Details Card */}
        <article className="flex flex-col gap-4 rounded-2xl border border-hairline-soft/80 bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] min-[640px]:p-7">
          {/* Status Badge */}
          <div className="flex items-center">
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

          {/* Date & Time */}
          <p className="font-display text-[1.4rem] leading-snug text-ink min-[640px]:text-[1.65rem]">
            {dateFormatted} às{" "}
            <span className="font-normal text-primary-action">{timeFormatted}</span>
          </p>

          <hr className="my-1 border-0 border-t border-hairline-soft" />

          {/* Details List */}
          <div className="flex flex-col gap-3.5">
            {/* Type & Dentist */}
            <div className="flex items-center gap-3">
              <User aria-hidden="true" className="size-5 shrink-0 text-primary-action" />
              <p className="font-body text-body-sm text-body">
                {APPOINTMENT_TYPE_LABELS[appointment.appointment_type]} · {appointment.dentist_name}
              </p>
            </div>

            {/* Clinic Name */}
            {appointment.clinic_name ? (
              <div className="flex items-center gap-3">
                <Building2 aria-hidden="true" className="size-5 shrink-0 text-primary-action" />
                <p className="font-body text-body-sm text-body">{appointment.clinic_name}</p>
              </div>
            ) : null}

            {/* Clinic Address */}
            {appointment.clinic_address ? (
              <div className="flex items-center gap-3">
                <MapPin aria-hidden="true" className="size-5 shrink-0 text-primary-action" />
                <p className="font-body text-body-sm text-body">{appointment.clinic_address}</p>
              </div>
            ) : null}

            {/* Clinic Phone */}
            {appointment.clinic_phone ? (
              <div className="flex items-center gap-3">
                <Phone aria-hidden="true" className="size-5 shrink-0 text-primary-action" />
                <a
                  href={`tel:${appointment.clinic_phone.replace(/\D/g, "")}`}
                  className="font-body text-body-sm font-medium text-primary-action hover:underline"
                >
                  {appointment.clinic_phone}
                </a>
              </div>
            ) : null}

            {/* Notes */}
            {appointment.notes ? (
              <div className="mt-1 flex items-start gap-3 rounded-xl bg-surface-soft/60 p-3">
                <FileText aria-hidden="true" className="mt-0.5 size-4.5 shrink-0 text-muted" />
                <p className="whitespace-pre-line font-body text-body-sm text-body">
                  {appointment.notes}
                </p>
              </div>
            ) : null}
          </div>
        </article>

        {/* Action Buttons Column */}
        <aside className="flex flex-col gap-3.5">
          {statusMutation.isError ? (
            <ErrorFeedback message={translateAppointmentError(statusMutation.error)} />
          ) : null}

          {/* Editar Button */}
          {canEdit(appointment.status) ? (
            <Link
              to={`/agenda/${appointment.id}/editar`}
              className="flex min-h-tap-target-min w-full items-center justify-center gap-2 rounded-2xl border border-primary-action bg-white px-6 py-3.5 font-body text-body-md font-medium text-primary-action shadow-xs transition-colors hover:bg-primary-action/5 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-primary-action focus-visible:ring-offset-2"
            >
              <Pencil aria-hidden="true" className="size-4.5" />
              <span>Editar</span>
            </Link>
          ) : null}

          {/* Status Actions (Concluir / Cancelar) */}
          {actions.map((action) => {
            const isComplete = action.status === "completed";
            const isCancel = action.status === "cancelled";

            const icon = isComplete ? (
              <CheckCircle2 aria-hidden="true" className="size-5" />
            ) : isCancel ? (
              <Trash2 aria-hidden="true" className="size-5" />
            ) : undefined;

            return (
              <ConfirmAction
                key={action.status}
                label={action.label}
                question={`Tem certeza que deseja ${action.label.toLowerCase()}?`}
                onConfirm={() => statusMutation.mutate(action.status)}
                disabled={statusMutation.isPending}
                icon={icon}
                variant={isComplete ? "primary" : "secondary"}
                className="rounded-2xl py-3.5"
              />
            );
          })}
        </aside>
      </div>
    </Screen>
  );
}
