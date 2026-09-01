import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

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
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

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
    <Screen
      title="Nova consulta"
      maxWidth="wide"
      spacing="compact"
      hideHeader
      className="relative"
    >
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
          className="font-display text-[1.75rem] font-normal leading-tight text-ink outline-none min-[640px]:text-[2.1rem]"
        >
          Nova consulta
        </h1>
        <p className="mt-0.5 font-body text-caption text-muted">
          Preencha as informações abaixo para agendar sua consulta.
        </p>
      </header>

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
