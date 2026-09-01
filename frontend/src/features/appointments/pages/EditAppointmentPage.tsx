import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";

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
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!query.isPending && !query.isError) {
      headingRef.current?.focus();
    }
  }, [query.isPending, query.isError]);

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
      <Screen title="Consulta não encontrada" maxWidth="wide" backTo="/agenda" backLabel="Agenda">
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
    <Screen
      title="Editar consulta"
      maxWidth="wide"
      spacing="compact"
      hideHeader
      className="relative"
    >
      {/* Back Link */}
      <Link
        to={`/agenda/${id}`}
        className="inline-flex min-h-tap-target-min w-fit items-center gap-1 font-body text-body-sm font-medium text-primary-action transition-colors hover:underline"
      >
        <ChevronLeft className="size-4" />
        <span>Consulta</span>
      </Link>

      {/* Editorial Header */}
      <header className="flex flex-col">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-[1.75rem] font-normal leading-tight text-ink outline-none min-[640px]:text-[2.1rem]"
        >
          Editar consulta
        </h1>
        <p className="mt-0.5 font-body text-caption text-muted">
          Edite as informações da sua consulta.
        </p>
      </header>

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
