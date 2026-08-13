import { describe, expect, it } from "vitest";

import { findPatientLink, patientDisplayName } from "./findPatientLink";
import type { CaregiverPatient } from "./types";

function makeLink(overrides: Partial<CaregiverPatient> = {}): CaregiverPatient {
  return {
    id: "link-1",
    patient_id: "patient-1",
    caregiver_email: "cuidador@example.com",
    caregiver_user_id: "caregiver-1",
    status: "active",
    can_view_reports: true,
    can_view_appointments: true,
    receive_alerts: true,
    invited_at: "2026-01-01T00:00:00Z",
    accepted_at: "2026-01-02T00:00:00Z",
    revoked_at: null,
    patient_name: "Maria Silva",
    ...overrides,
  };
}

describe("findPatientLink", () => {
  it("encontra o vínculo pelo patient_id", () => {
    const link = makeLink({ patient_id: "patient-42" });

    expect(findPatientLink([link], "patient-42")).toBe(link);
  });

  it("devolve undefined quando não encontra — revogado no meio da sessão, ou o próprio id do cuidador", () => {
    const link = makeLink({ patient_id: "patient-1" });

    expect(findPatientLink([link], "outro-id")).toBeUndefined();
    expect(findPatientLink([], "patient-1")).toBeUndefined();
  });
});

describe("patientDisplayName", () => {
  it("usa o nome quando presente", () => {
    expect(patientDisplayName(makeLink({ patient_name: "Maria Silva" }))).toBe("Maria Silva");
  });

  it("usa fallback quando o nome é null (RLS bloqueou a leitura)", () => {
    expect(patientDisplayName(makeLink({ patient_name: null }))).toBe("Paciente");
  });

  it("usa fallback quando o nome é string vazia (leitura ok, nome nunca preenchido)", () => {
    expect(patientDisplayName(makeLink({ patient_name: "" }))).toBe("Paciente");
  });
});
