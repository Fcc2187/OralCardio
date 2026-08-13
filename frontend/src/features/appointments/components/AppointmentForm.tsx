import { useState, type FormEvent } from "react";

import { Button } from "@/shared/components/ui/Button";
import { ErrorFeedback } from "@/shared/components/ui/Feedback";
import { Select } from "@/shared/components/ui/Select";
import { TextField } from "@/shared/components/ui/TextField";
import { Textarea } from "@/shared/components/ui/Textarea";
import { maxSchedulingDateTimeLocalValue, nowAsDateTimeLocalValue } from "@/shared/utils/dateTimeLocal";

import { APPOINTMENT_TYPE_LABELS } from "../appointmentLabels";
import type { AppointmentFormState } from "../appointmentFormState";
import type { AppointmentType } from "../types";

interface AppointmentFormProps {
  initialValue: AppointmentFormState;
  submitLabel: string;
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (state: AppointmentFormState) => void;
}

/** Criar e editar consulta diferem só nas props acima — o formulário em si
 * é o mesmo, e cada página decide o que fazer com o estado submetido. */
export function AppointmentForm({
  initialValue,
  submitLabel,
  isSubmitting,
  errorMessage,
  onSubmit,
}: AppointmentFormProps) {
  const [form, setForm] = useState(initialValue);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-lg" noValidate>
      <TextField
        label="Data e hora"
        type="datetime-local"
        required
        min={nowAsDateTimeLocalValue()}
        max={maxSchedulingDateTimeLocalValue()}
        value={form.scheduledAtLocal}
        onChange={(event) =>
          setForm((current) => ({ ...current, scheduledAtLocal: event.target.value }))
        }
      />

      <Select
        label="Tipo de consulta"
        required
        value={form.appointmentType}
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            appointmentType: event.target.value as AppointmentType,
          }))
        }
      >
        <option value="" disabled>
          Selecione uma opção
        </option>
        {Object.entries(APPOINTMENT_TYPE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>

      <TextField
        label="Nome do dentista"
        required
        maxLength={200}
        value={form.dentistName}
        onChange={(event) => setForm((current) => ({ ...current, dentistName: event.target.value }))}
      />

      <TextField
        label="Nome da clínica (opcional)"
        maxLength={200}
        value={form.clinicName}
        onChange={(event) => setForm((current) => ({ ...current, clinicName: event.target.value }))}
      />

      <TextField
        label="Endereço da clínica (opcional)"
        maxLength={500}
        value={form.clinicAddress}
        onChange={(event) =>
          setForm((current) => ({ ...current, clinicAddress: event.target.value }))
        }
      />

      <TextField
        label="Telefone da clínica (opcional)"
        type="tel"
        maxLength={30}
        value={form.clinicPhone}
        onChange={(event) => setForm((current) => ({ ...current, clinicPhone: event.target.value }))}
      />

      <Textarea
        label="Notas (opcional)"
        maxLength={1000}
        value={form.notes}
        onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
      />

      {errorMessage ? <ErrorFeedback message={errorMessage} /> : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Salvando…" : submitLabel}
      </Button>
    </form>
  );
}
