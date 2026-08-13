import { describe, expect, it } from "vitest";

import { buildCaregiverInvitePayload } from "./buildCaregiverInvitePayload";
import type { CaregiverInviteFormState } from "./buildCaregiverInvitePayload";

function validState(overrides: Partial<CaregiverInviteFormState> = {}): CaregiverInviteFormState {
  return {
    caregiverEmail: "filha@example.com",
    canViewReports: true,
    canViewAppointments: true,
    receiveAlerts: true,
    ...overrides,
  };
}

describe("buildCaregiverInvitePayload", () => {
  it("monta o payload com o e-mail normalizado e as permissões informadas", () => {
    const payload = buildCaregiverInvitePayload(validState());

    expect(payload).toEqual({
      caregiver_email: "filha@example.com",
      can_view_reports: true,
      can_view_appointments: true,
      receive_alerts: true,
    });
  });

  it("normaliza maiúsculas e espaços no e-mail", () => {
    const payload = buildCaregiverInvitePayload(
      validState({ caregiverEmail: "  Filha@Example.com  " }),
    );

    expect(payload.caregiver_email).toBe("filha@example.com");
  });

  it("rejeita e-mail vazio, inclusive só espaços", () => {
    expect(() => buildCaregiverInvitePayload(validState({ caregiverEmail: "   " }))).toThrow(
      "Informe o e-mail",
    );
  });

  it("preserva as permissões desligadas individualmente", () => {
    const payload = buildCaregiverInvitePayload(
      validState({ canViewReports: false, canViewAppointments: true, receiveAlerts: false }),
    );

    expect(payload.can_view_reports).toBe(false);
    expect(payload.can_view_appointments).toBe(true);
    expect(payload.receive_alerts).toBe(false);
  });
});
