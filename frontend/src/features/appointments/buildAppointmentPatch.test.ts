import { describe, expect, it } from "vitest";

import { appointmentToFormState } from "./appointmentFormState";
import { buildAppointmentPatch } from "./buildAppointmentPatch";
import type { Appointment } from "./types";

const NOW_MS = new Date(2026, 5, 15, 10, 0).getTime();

const ORIGINAL: Appointment = {
  id: "apt-1",
  user_id: "user-1",
  // Formato com offset "+00:00", como o backend realmente emite — diferente
  // do "Z" que localDateTimeInputToIso produz. A comparação precisa ser por
  // instante, não por igualdade de string.
  scheduled_at: "2026-09-15T17:30:00+00:00",
  appointment_type: "routine_checkup",
  dentist_name: "Dra. Ana",
  clinic_name: "Clínica Sorriso",
  clinic_address: "Rua A, 123",
  clinic_phone: "11999999999",
  notes: "Levar exames",
  status: "scheduled",
  created_at: "2026-01-01T00:00:00+00:00",
  updated_at: "2026-01-01T00:00:00+00:00",
};

describe("buildAppointmentPatch", () => {
  it("devolve objeto vazio quando nada mudou", () => {
    const unchangedForm = appointmentToFormState(ORIGINAL);

    expect(buildAppointmentPatch(ORIGINAL, unchangedForm, NOW_MS)).toEqual({});
  });

  it("inclui só o campo que mudou", () => {
    const form = { ...appointmentToFormState(ORIGINAL), dentistName: "Dr. Novo" };

    expect(buildAppointmentPatch(ORIGINAL, form, NOW_MS)).toEqual({ dentist_name: "Dr. Novo" });
  });

  it("envia null para limpar um campo opcional", () => {
    const form = { ...appointmentToFormState(ORIGINAL), clinicName: "" };

    expect(buildAppointmentPatch(ORIGINAL, form, NOW_MS)).toEqual({ clinic_name: null });
  });

  it("omite scheduled_at quando o instante não muda, mesmo com formato de string diferente (Z vs +00:00)", () => {
    const unchangedForm = appointmentToFormState(ORIGINAL);

    const patch = buildAppointmentPatch(ORIGINAL, unchangedForm, NOW_MS);

    expect(patch.scheduled_at).toBeUndefined();
  });

  it("inclui scheduled_at convertido para ISO quando a data muda para uma data futura válida", () => {
    const form = { ...appointmentToFormState(ORIGINAL), scheduledAtLocal: "2026-10-01T09:00" };

    const patch = buildAppointmentPatch(ORIGINAL, form, NOW_MS);

    expect(patch.scheduled_at).toBe("2026-10-01T12:00:00.000Z");
  });

  it("rejeita mudar a data para o passado", () => {
    const form = { ...appointmentToFormState(ORIGINAL), scheduledAtLocal: "2020-01-01T09:00" };

    expect(() => buildAppointmentPatch(ORIGINAL, form, NOW_MS)).toThrow("precisa ser no futuro");
  });

  it("não bloqueia uma consulta cuja data original já é passada, se o campo de data não foi tocado", () => {
    const pastAppointment: Appointment = { ...ORIGINAL, scheduled_at: "2020-01-01T12:00:00+00:00" };
    const unchangedForm = appointmentToFormState(pastAppointment);
    const form = { ...unchangedForm, dentistName: "Dr. Corrigido" };

    const patch = buildAppointmentPatch(pastAppointment, form, NOW_MS);

    expect(patch).toEqual({ dentist_name: "Dr. Corrigido" });
  });

  it("rejeita nome do dentista vazio", () => {
    const form = { ...appointmentToFormState(ORIGINAL), dentistName: "   " };

    expect(() => buildAppointmentPatch(ORIGINAL, form, NOW_MS)).toThrow(
      "Informe o nome do dentista",
    );
  });

  it("rejeita tipo de consulta vazio", () => {
    const form = { ...appointmentToFormState(ORIGINAL), appointmentType: "" as const };

    expect(() => buildAppointmentPatch(ORIGINAL, form, NOW_MS)).toThrow(
      "Selecione o tipo de consulta",
    );
  });
});
