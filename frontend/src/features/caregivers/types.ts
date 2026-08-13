export type CaregiverStatus = "pending" | "active" | "revoked";

export interface Caregiver {
  id: string;
  patient_id: string;
  caregiver_email: string;
  caregiver_user_id: string | null;
  status: CaregiverStatus;
  can_view_reports: boolean;
  can_view_appointments: boolean;
  receive_alerts: boolean;
  invited_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
}

/** Vínculo do lado do cuidador — o mesmo formato de `Caregiver`, mais o nome
 * do paciente. `patient_name` é `null` quando o RLS não deixou o backend ler
 * a linha do paciente (as duas permissões desligadas), e pode ser `""`
 * quando a leitura funcionou mas o paciente nunca preencheu o nome — os dois
 * casos precisam do mesmo fallback visual (ver `patientDisplayName`). */
export interface CaregiverPatient extends Caregiver {
  patient_name: string | null;
}

export interface CaregiverInviteInput {
  caregiver_email: string;
  can_view_reports: boolean;
  can_view_appointments: boolean;
  receive_alerts: boolean;
}

export interface CaregiverPermissionsPatch {
  can_view_reports?: boolean;
  can_view_appointments?: boolean;
  receive_alerts?: boolean;
}
