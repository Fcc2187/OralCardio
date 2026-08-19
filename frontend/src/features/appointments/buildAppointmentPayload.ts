import { localDateTimeInputToIso } from "@/shared/utils/dateTimeLocal";

import type { AppointmentFormState } from "./appointmentFormState";
import type { AppointmentInput } from "./types";

function toNullableString(text: string): string | null {
  const trimmed = text.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function assertMaxLength(value: string, maximum: number, label: string): void {
  if (value.length > maximum) throw new Error(`${label} aceita no máximo ${maximum} caracteres.`);
}

/** DTO de criação + validação. Opcionais em branco viram `null` — no PATCH a
 * regra é diferente (ver buildAppointmentPatch.ts, que usa `""`, porque o
 * backend não consegue anular campo com `null`). Lança `Error` com mensagem
 * em pt-BR, igual ao precedente buildHealthProfilePayload. */
export function buildAppointmentPayload(
  state: AppointmentFormState,
  nowMs: number = Date.now(),
): AppointmentInput {
  const dentistName = state.dentistName.trim();
  if (dentistName.length === 0) {
    throw new Error("Informe o nome do dentista.");
  }
  assertMaxLength(dentistName, 200, "O nome do dentista");
  assertMaxLength(state.clinicName.trim(), 200, "O nome da clínica");
  assertMaxLength(state.clinicAddress.trim(), 500, "O endereço da clínica");
  assertMaxLength(state.clinicPhone.trim(), 30, "O telefone da clínica");
  assertMaxLength(state.notes.trim(), 1000, "As notas");

  if (state.appointmentType === "") {
    throw new Error("Selecione o tipo de consulta.");
  }

  const scheduledAtIso = localDateTimeInputToIso(state.scheduledAtLocal);
  if (scheduledAtIso === null) {
    throw new Error("Informe uma data e hora válidas.");
  }

  const scheduledAtMs = new Date(scheduledAtIso).getTime();
  if (scheduledAtMs <= nowMs) {
    throw new Error("A data da consulta precisa ser no futuro.");
  }

  const fiveYearsFromNow = new Date(nowMs);
  fiveYearsFromNow.setFullYear(fiveYearsFromNow.getFullYear() + 5);
  if (scheduledAtMs > fiveYearsFromNow.getTime()) {
    throw new Error("A data da consulta está longe demais no futuro.");
  }

  return {
    scheduled_at: scheduledAtIso,
    appointment_type: state.appointmentType,
    dentist_name: dentistName,
    clinic_name: toNullableString(state.clinicName),
    clinic_address: toNullableString(state.clinicAddress),
    clinic_phone: toNullableString(state.clinicPhone),
    notes: toNullableString(state.notes),
  };
}
