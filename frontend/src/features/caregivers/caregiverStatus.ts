import type { CaregiverStatus } from "./types";

export const CAREGIVER_STATUS_LABELS: Record<CaregiverStatus, string> = {
  pending: "Pendente",
  active: "Ativo",
  revoked: "Revogado",
};

export const CAREGIVER_STATUS_BADGE_VARIANT: Record<CaregiverStatus, "neutral" | "coral"> = {
  pending: "coral",
  active: "neutral",
  revoked: "neutral",
};

/** `pending`: as permissões são o momento mais relevante — o paciente
 * decide o que o cuidador vai ver ANTES de ele aceitar. `active`: seguem
 * editáveis a qualquer momento. `revoked`: o PATCH do backend não tem guard
 * de estado — o toggle pareceria funcionar sem significar nada, então fica
 * desabilitado e a linha oferece "Convidar novamente" em vez disso. */
export function canEditPermissions(status: CaregiverStatus): boolean {
  return status !== "revoked";
}
