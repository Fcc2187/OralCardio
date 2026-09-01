import {
  Building2,
  Calendar,
  CalendarCheck,
  FileText,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";

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

function FieldLabel({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary-action/10 text-primary-action"
      >
        {icon}
      </span>
      <span className="font-body text-[0.825rem] font-medium text-body-strong min-[640px]:text-body-sm">{label}</span>
    </span>
  );
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 min-[640px]:gap-3.5">
      {/* Form Fields Card */}
      <div className="rounded-2xl border border-hairline-soft/80 bg-white p-4 shadow-[0_4px_24px_rgba(0,0,0,0.03)] min-[640px]:p-5 min-[1024px]:px-6 min-[1024px]:py-4">
        <div className="grid grid-cols-1 gap-3 min-[640px]:grid-cols-2 min-[640px]:gap-x-5 min-[640px]:gap-y-3">
          {/* Data e hora */}
          <div>
            <TextField
              label={<FieldLabel icon={<Calendar className="size-3.5" />} label="Data e hora (Brasília)" />}
              type="datetime-local"
              required
              className="text-body-sm"
              min={nowAsDateTimeLocalValue()}
              max={maxSchedulingDateTimeLocalValue()}
              value={form.scheduledAtLocal}
              onChange={(event) =>
                setForm((current) => ({ ...current, scheduledAtLocal: event.target.value }))
              }
            />
          </div>

          {/* Tipo de consulta */}
          <div>
            <Select
              label={<FieldLabel icon={<CalendarCheck className="size-3.5" />} label="Tipo de consulta" />}
              required
              className="text-body-sm"
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
          </div>

          {/* Nome do dentista */}
          <div>
            <TextField
              label={<FieldLabel icon={<User className="size-3.5" />} label="Nome do dentista" />}
              required
              maxLength={200}
              className="text-body-sm"
              placeholder="Digite o nome do dentista"
              value={form.dentistName}
              onChange={(event) =>
                setForm((current) => ({ ...current, dentistName: event.target.value }))
              }
            />
          </div>

          {/* Nome da clínica */}
          <div>
            <TextField
              label={<FieldLabel icon={<Building2 className="size-3.5" />} label="Nome da clínica (opcional)" />}
              maxLength={200}
              className="text-body-sm"
              placeholder="Digite o nome da clínica"
              value={form.clinicName}
              onChange={(event) =>
                setForm((current) => ({ ...current, clinicName: event.target.value }))
              }
            />
          </div>

          {/* Endereço da clínica */}
          <div>
            <TextField
              label={<FieldLabel icon={<MapPin className="size-3.5" />} label="Endereço da clínica (opcional)" />}
              maxLength={500}
              className="text-body-sm"
              placeholder="Digite o endereço da clínica"
              value={form.clinicAddress}
              onChange={(event) =>
                setForm((current) => ({ ...current, clinicAddress: event.target.value }))
              }
            />
          </div>

          {/* Telefone da clínica */}
          <div>
            <TextField
              label={<FieldLabel icon={<Phone className="size-3.5" />} label="Telefone da clínica (opcional)" />}
              type="tel"
              maxLength={30}
              className="text-body-sm"
              placeholder="Digite o telefone da clínica"
              value={form.clinicPhone}
              onChange={(event) =>
                setForm((current) => ({ ...current, clinicPhone: event.target.value }))
              }
            />
          </div>

          {/* Notas */}
          <div className="min-[640px]:col-span-2">
            <Textarea
              label={<FieldLabel icon={<FileText className="size-3.5" />} label="Notas (opcional)" />}
              maxLength={1000}
              rows={2}
              className="text-body-sm"
              placeholder="Adicione observações ou informações importantes"
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            />
          </div>
        </div>
      </div>

      {errorMessage ? <ErrorFeedback message={errorMessage} /> : null}

      {/* Action Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex min-h-tap-target-min w-full items-center justify-center gap-2 rounded-2xl bg-primary-action px-6 py-3.5 font-display text-[1.1rem] font-medium text-white shadow-sm transition-all hover:bg-primary-pressed active:scale-[0.99] disabled:bg-primary-disabled disabled:text-muted min-[640px]:text-title-md focus-visible:ring-2 focus-visible:ring-primary-action focus-visible:ring-offset-2"
      >
        <Calendar aria-hidden="true" className="size-5" />
        <span>{isSubmitting ? "Salvando…" : submitLabel}</span>
      </button>
    </form>
  );
}
