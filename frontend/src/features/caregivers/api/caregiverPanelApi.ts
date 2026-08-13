import { httpClient } from "@/shared/api/httpClient";
import type { Page } from "@/shared/types/common";
import type { UserStats } from "@/shared/types/gamification";

// Import entre features aprovado (caregivers -> appointments/brushing): o
// painel do cuidador lê exatamente o mesmo formato de consulta e de sessão
// de escovação que o paciente já usa — duplicar o tipo divergiria com o
// tempo. `shared/` continua nunca importando de `features/`.
import type { Appointment } from "@/features/appointments/types";
import type { BrushingSession } from "@/features/brushing/types";

import type { Caregiver, CaregiverPatient } from "../types";

export function listInvitations(): Promise<Caregiver[]> {
  return httpClient.get<Caregiver[]>("/api/v1/caregiver/invitations");
}

// Sem corpo — o endpoint identifica o convite pelo id na URL e o usuário
// pelo JWT; não há nada a enviar.
export function acceptInvitation(invitationId: string): Promise<Caregiver> {
  return httpClient.post<Caregiver>(`/api/v1/caregiver/invitations/${invitationId}/accept`);
}

export function listMyPatients(): Promise<CaregiverPatient[]> {
  return httpClient.get<CaregiverPatient[]>("/api/v1/caregiver/patients");
}

export function fetchPatientStats(patientId: string): Promise<UserStats> {
  return httpClient.get<UserStats>(`/api/v1/caregiver/patients/${patientId}/stats`);
}

export function listPatientBrushingSessions(
  patientId: string,
  params: { limit: number; offset: number },
): Promise<Page<BrushingSession>> {
  const query = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  });
  return httpClient.get<Page<BrushingSession>>(
    `/api/v1/caregiver/patients/${patientId}/brushing-sessions?${query.toString()}`,
  );
}

export function listPatientAppointments(
  patientId: string,
  params: { limit: number; offset: number },
): Promise<Page<Appointment>> {
  const query = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  });
  return httpClient.get<Page<Appointment>>(
    `/api/v1/caregiver/patients/${patientId}/appointments?${query.toString()}`,
  );
}
