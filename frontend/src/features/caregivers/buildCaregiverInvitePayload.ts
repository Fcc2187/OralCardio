import type { CaregiverInviteInput } from "./types";

export interface CaregiverInviteFormState {
  caregiverEmail: string;
  canViewReports: boolean;
  canViewAppointments: boolean;
  receiveAlerts: boolean;
}

export const INITIAL_CAREGIVER_INVITE_FORM_STATE: CaregiverInviteFormState = {
  caregiverEmail: "",
  canViewReports: true,
  canViewAppointments: true,
  receiveAlerts: true,
};

/** DTO de convite + validação. Espelha `buildAppointmentPayload`: lança
 * `Error` em pt-BR. Formato de e-mail não é validado aqui — o input usa
 * `type="email"` e o backend valida com `EmailStr`; duplicar a checagem em
 * regex só divergiria com o tempo. */
export function buildCaregiverInvitePayload(
  state: CaregiverInviteFormState,
): CaregiverInviteInput {
  const caregiverEmail = state.caregiverEmail.trim().toLowerCase();
  if (caregiverEmail.length === 0) {
    throw new Error("Informe o e-mail de quem vai acompanhar.");
  }

  return {
    caregiver_email: caregiverEmail,
    can_view_reports: state.canViewReports,
    can_view_appointments: state.canViewAppointments,
    receive_alerts: state.receiveAlerts,
  };
}
