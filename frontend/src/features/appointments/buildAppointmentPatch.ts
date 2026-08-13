import { localDateTimeInputToIso } from "@/shared/utils/dateTimeLocal";

import type { AppointmentFormState } from "./appointmentFormState";
import type { Appointment, AppointmentPatch } from "./types";

function optionalPatchValue(formValue: string, originalValue: string | null): string | undefined {
  const trimmed = formValue.trim();
  const original = originalValue ?? "";
  if (trimmed === original) return undefined;
  // PATCH não consegue anular campo com `null` (o service filtra
  // `is not None` antes de gravar) — só dentist_name tem min_length=1 no
  // backend, então "" é o único jeito de realmente limpar um opcional.
  return trimmed;
}

/** Diff puro contra o registro original — só inclui campos que de fato
 * mudaram (evita reenviar `scheduled_at` inalterado, que perderia os
 * segundos no round-trip, e faz "salvar sem alterar nada" virar `{}`).
 * Valida data futura apenas quando o campo de data foi alterado: bloquear
 * no passado ao só corrigir um typo numa consulta que já aconteceu seria
 * hostil com o paciente. Lança `Error` com mensagem em pt-BR. */
export function buildAppointmentPatch(
  original: Appointment,
  form: AppointmentFormState,
  nowMs: number = Date.now(),
): AppointmentPatch {
  const patch: AppointmentPatch = {};

  const scheduledAtIso = localDateTimeInputToIso(form.scheduledAtLocal);
  if (scheduledAtIso === null) {
    throw new Error("Informe uma data e hora válidas.");
  }

  const scheduledAtChanged =
    new Date(scheduledAtIso).getTime() !== new Date(original.scheduled_at).getTime();

  if (scheduledAtChanged) {
    const scheduledAtMs = new Date(scheduledAtIso).getTime();
    if (scheduledAtMs <= nowMs) {
      throw new Error("A data da consulta precisa ser no futuro.");
    }

    const fiveYearsFromNow = new Date(nowMs);
    fiveYearsFromNow.setFullYear(fiveYearsFromNow.getFullYear() + 5);
    if (scheduledAtMs > fiveYearsFromNow.getTime()) {
      throw new Error("A data da consulta está longe demais no futuro.");
    }

    patch.scheduled_at = scheduledAtIso;
  }

  if (form.appointmentType === "") {
    throw new Error("Selecione o tipo de consulta.");
  }
  if (form.appointmentType !== original.appointment_type) {
    patch.appointment_type = form.appointmentType;
  }

  const dentistName = form.dentistName.trim();
  if (dentistName.length === 0) {
    throw new Error("Informe o nome do dentista.");
  }
  if (dentistName !== original.dentist_name) {
    patch.dentist_name = dentistName;
  }

  const clinicName = optionalPatchValue(form.clinicName, original.clinic_name);
  if (clinicName !== undefined) patch.clinic_name = clinicName;

  const clinicAddress = optionalPatchValue(form.clinicAddress, original.clinic_address);
  if (clinicAddress !== undefined) patch.clinic_address = clinicAddress;

  const clinicPhone = optionalPatchValue(form.clinicPhone, original.clinic_phone);
  if (clinicPhone !== undefined) patch.clinic_phone = clinicPhone;

  const notes = optionalPatchValue(form.notes, original.notes);
  if (notes !== undefined) patch.notes = notes;

  return patch;
}
