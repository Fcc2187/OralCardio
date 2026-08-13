import { httpClient } from "@/shared/api/httpClient";

import type { Caregiver, CaregiverInviteInput, CaregiverPermissionsPatch } from "../types";

// Array puro — não `Page`. Um paciente realista tem poucos cuidadores; a API
// não pagina esta lista.
export function listCaregivers(): Promise<Caregiver[]> {
  return httpClient.get<Caregiver[]>("/api/v1/caregivers");
}

export function inviteCaregiver(input: CaregiverInviteInput): Promise<Caregiver> {
  return httpClient.post<Caregiver>("/api/v1/caregivers", input);
}

export function patchCaregiverPermissions(
  id: string,
  patch: CaregiverPermissionsPatch,
): Promise<Caregiver> {
  return httpClient.patch<Caregiver>(`/api/v1/caregivers/${id}`, patch);
}

// DELETE devolve 200 com o vínculo atualizado (status: "revoked"), não 204 —
// o vínculo não é removido, só marcado.
export function revokeCaregiver(id: string): Promise<Caregiver> {
  return httpClient.delete<Caregiver>(`/api/v1/caregivers/${id}`);
}
