import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { HttpError } from "@/shared/api/httpClient";
import { appointmentQueryKey, appointmentsListQueryKey } from "@/shared/api/queryKeys";
import { Badge } from "@/shared/components/ui/Badge";
import { ConfirmAction } from "@/shared/components/ui/ConfirmAction";
import { ErrorFeedback, LoadingFeedback } from "@/shared/components/ui/Feedback";
import { LinkButton } from "@/shared/components/ui/LinkButton";
import { Screen } from "@/shared/components/layout/Screen";
import { formatDateTimeLong } from "@/shared/utils/formatDate";

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

  const statusMutation = useMutation({
    mutationFn: (status: AppointmentStatus) => patchAppointment(id, { status }),
    onSuccess: (updated) => {
      queryClient.setQueryData(appointmentQueryKey(id), updated);
      queryClient.invalidateQueries({ queryKey: appointmentsListQueryKey });
    },
  });

  if (query.isPending) {
    return <LoadingFeedback message="Carregando a consulta…" />;
  }

  if (query.isError) {
    const isNotFound = query.error instanceof HttpError && query.error.status === 404;
    return (
      <Screen title="Consulta não encontrada" backTo="/agenda" backLabel="Agenda">
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
  const actions = availableStatusActions(appointment.status).filter((action) =>
    VISIBLE_ACTION_TARGETS.has(action.status),
  );

  return (
    <Screen title="Consulta" backTo="/agenda" backLabel="Agenda">
      <div className="flex flex-col gap-sm rounded-lg border border-hairline bg-canvas p-lg">
        <Badge variant={appointment.status === "scheduled" ? "coral" : "neutral"}>
          {APPOINTMENT_STATUS_LABELS[appointment.status]}
        </Badge>
        <p className="font-display text-title-lg">{formatDateTimeLong(appointment.scheduled_at)}</p>
        <p className="font-body text-body-md text-body">
          {APPOINTMENT_TYPE_LABELS[appointment.appointment_type]} · {appointment.dentist_name}
        </p>
        {appointment.clinic_name ? (
          <p className="font-body text-body-sm text-muted">{appointment.clinic_name}</p>
        ) : null}
        {appointment.clinic_address ? (
          <p className="font-body text-body-sm text-muted">{appointment.clinic_address}</p>
        ) : null}
        {appointment.clinic_phone ? (
          <a
            href={`tel:${appointment.clinic_phone.replace(/\D/g, "")}`}
            className="w-fit font-body text-body-sm text-primary-action"
          >
            {appointment.clinic_phone}
          </a>
        ) : null}
        {appointment.notes ? (
          <p className="whitespace-pre-line font-body text-body-sm text-body">{appointment.notes}</p>
        ) : null}
      </div>

      {statusMutation.isError ? (
        <ErrorFeedback message={translateAppointmentError(statusMutation.error)} />
      ) : null}

      {canEdit(appointment.status) ? (
        <LinkButton to={`/agenda/${appointment.id}/editar`} variant="secondary">
          Editar
        </LinkButton>
      ) : null}

      {actions.map((action) => (
        <ConfirmAction
          key={action.status}
          label={action.label}
          question={`Tem certeza que deseja ${action.label.toLowerCase()}?`}
          onConfirm={() => statusMutation.mutate(action.status)}
          disabled={statusMutation.isPending}
        />
      ))}
    </Screen>
  );
}
