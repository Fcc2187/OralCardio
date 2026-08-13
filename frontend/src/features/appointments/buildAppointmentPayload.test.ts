import { describe, expect, it } from "vitest";

import { localDateTimeInputToIso } from "@/shared/utils/dateTimeLocal";

import type { AppointmentFormState } from "./appointmentFormState";
import { buildAppointmentPayload } from "./buildAppointmentPayload";

const NOW_MS = new Date(2026, 5, 15, 10, 0).getTime();

function futureLocalValue(): string {
  return "2026-09-15T14:30";
}

function validState(overrides: Partial<AppointmentFormState> = {}): AppointmentFormState {
  return {
    scheduledAtLocal: futureLocalValue(),
    appointmentType: "routine_checkup",
    dentistName: "Dra. Ana",
    clinicName: "",
    clinicAddress: "",
    clinicPhone: "",
    notes: "",
    ...overrides,
  };
}

describe("buildAppointmentPayload", () => {
  it("monta o payload com data futura convertida para ISO", () => {
    const payload = buildAppointmentPayload(validState(), NOW_MS);

    expect(payload.scheduled_at).toBe(localDateTimeInputToIso(futureLocalValue()));
    expect(payload.appointment_type).toBe("routine_checkup");
    expect(payload.dentist_name).toBe("Dra. Ana");
  });

  it("rejeita nome do dentista vazio, inclusive só espaços", () => {
    expect(() => buildAppointmentPayload(validState({ dentistName: "   " }), NOW_MS)).toThrow(
      "Informe o nome do dentista",
    );
  });

  it("rejeita quando nenhum tipo de consulta foi selecionado", () => {
    expect(() =>
      buildAppointmentPayload(validState({ appointmentType: "" }), NOW_MS),
    ).toThrow("Selecione o tipo de consulta");
  });

  it("rejeita data/hora inválida ou vazia", () => {
    expect(() => buildAppointmentPayload(validState({ scheduledAtLocal: "" }), NOW_MS)).toThrow(
      "data e hora válidas",
    );
  });

  it("rejeita data no passado", () => {
    expect(() =>
      buildAppointmentPayload(validState({ scheduledAtLocal: "2020-01-01T10:00" }), NOW_MS),
    ).toThrow("precisa ser no futuro");
  });

  it("rejeita data mais de 5 anos no futuro", () => {
    expect(() =>
      buildAppointmentPayload(validState({ scheduledAtLocal: "2032-01-01T10:00" }), NOW_MS),
    ).toThrow("longe demais");
  });

  it("converte campos opcionais em branco para null", () => {
    const payload = buildAppointmentPayload(
      validState({ clinicName: "  ", clinicAddress: "", clinicPhone: "  ", notes: "" }),
      NOW_MS,
    );

    expect(payload.clinic_name).toBeNull();
    expect(payload.clinic_address).toBeNull();
    expect(payload.clinic_phone).toBeNull();
    expect(payload.notes).toBeNull();
  });

  it("preserva campos opcionais preenchidos, com trim", () => {
    const payload = buildAppointmentPayload(
      validState({ clinicName: "  Clínica Sorriso  " }),
      NOW_MS,
    );

    expect(payload.clinic_name).toBe("Clínica Sorriso");
  });
});
