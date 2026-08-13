import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import { appointmentQueryKey, appointmentsListQueryKey } from "@/shared/api/queryKeys";
import { ErrorFeedback, LoadingFeedback } from "@/shared/components/ui/Feedback";
import { Screen } from "@/shared/components/layout/Screen";

import { patchAppointment } from "../api/appointmentsApi";
import { useAppointmentQuery } from "../api/useAppointmentQueries";
import { appointmentToFormState, type AppointmentFormState } from "../appointmentFormState";
import { translateAppointmentError } from "../appointmentErrorMessages";
import { canEdit } from "../appointmentStatusActions";
import { buildAppointmentPatch } from "../buildAppointmentPatch";
import { AppointmentForm } from "../components/AppointmentForm";

export function EditAppointmentPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const query = useAppointmentQuery(id);
  const [validationError, setValidationError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (patch: ReturnType<typeof buildAppointmentPatch>) => patchAppointment(id, patch),
    onSuccess: (updated) => {
      queryClient.setQueryData(appointmentQueryKey(id), updated);
      queryClient.invalidateQueries({ queryKey: appointmentsListQueryKey });
      navigate(`/agenda/${id}`, { replace: true });
    },
  });

  if (query.isPending) {
    return <LoadingFeedback message="Carregando a consulta…" />;
  }

  if (query.isError) {
    return (
      <Screen title="Consulta não encontrada" backTo="/agenda" backLabel="Agenda">
        <ErrorFeedback message="Consulta não encontrada." />
      </Screen>
    );
  }

  const appointment = query.data;

  if (!canEdit(appointment.status)) {
    return <Navigate to={`/agenda/${id}`} replace />;
  }

  function handleSubmit(form: AppointmentFormState) {
    setValidationError(null);
    try {
      const patch = buildAppointmentPatch(appointment, form);
      mutation.mutate(patch);
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : "Formulário inválido.");
    }
  }

  const errorMessage =
    validationError ?? (mutation.isError ? translateAppointmentError(mutation.error) : null);

  return (
    <Screen title="Editar consulta" backTo={`/agenda/${id}`} backLabel="Consulta">
      <AppointmentForm
        initialValue={appointmentToFormState(appointment)}
        submitLabel="Salvar alterações"
        isSubmitting={mutation.isPending}
        errorMessage={errorMessage}
        onSubmit={handleSubmit}
      />
    </Screen>
  );
}
