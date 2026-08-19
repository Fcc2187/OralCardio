import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { invalidateGamifiedQueries } from "@/shared/api/invalidateGamifiedQueries";
import { createIdempotencyKey } from "@/shared/api/httpClient";
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
  const idempotencyKeyRef = useRef<string | null>(null);

  const mutation = useMutation({
    mutationFn: ({ payload, idempotencyKey }: { payload: ReturnType<typeof buildAppointmentPayload>; idempotencyKey: string }) =>
      createAppointment(payload, { idempotencyKey }),
    onSuccess: () => {
      idempotencyKeyRef.current = null;
      queryClient.invalidateQueries({ queryKey: appointmentsListQueryKey });
      invalidateGamifiedQueries(queryClient);
      navigate("/agenda", { replace: true });
    },
  });

  function handleSubmit(state: AppointmentFormState) {
    setValidationError(null);
    try {
      const payload = buildAppointmentPayload(state);
      idempotencyKeyRef.current ??= createIdempotencyKey();
      mutation.mutate({ payload, idempotencyKey: idempotencyKeyRef.current });
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
