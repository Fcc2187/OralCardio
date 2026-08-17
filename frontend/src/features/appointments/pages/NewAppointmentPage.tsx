import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { invalidateGamifiedQueries } from "@/shared/api/invalidateGamifiedQueries";
import { appointmentsListQueryKey } from "@/shared/api/queryKeys";
import { Screen } from "@/shared/components/layout/Screen";

import { createAppointment } from "../api/appointmentsApi";
import { translateAppointmentError } from "../appointmentErrorMessages";
import { INITIAL_APPOINTMENT_FORM_STATE, type AppointmentFormState } from "../appointmentFormState";
import { buildAppointmentPayload } from "../buildAppointmentPayload";
import { AppointmentForm } from "../components/AppointmentForm";

export function NewAppointmentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [validationError, setValidationError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentsListQueryKey });
      invalidateGamifiedQueries(queryClient);
      navigate("/agenda", { replace: true });
    },
  });

  function handleSubmit(state: AppointmentFormState) {
    setValidationError(null);
    try {
      const payload = buildAppointmentPayload(state);
      mutation.mutate(payload);
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : "Formulário inválido.");
    }
  }

  const errorMessage =
    validationError ?? (mutation.isError ? translateAppointmentError(mutation.error) : null);

  return (
    <Screen title="Nova consulta" backTo="/agenda" backLabel="Agenda">
      <AppointmentForm
        initialValue={INITIAL_APPOINTMENT_FORM_STATE}
        submitLabel="Agendar"
        isSubmitting={mutation.isPending}
        errorMessage={errorMessage}
        onSubmit={handleSubmit}
      />
    </Screen>
  );
}
