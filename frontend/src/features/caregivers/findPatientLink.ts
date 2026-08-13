import type { CaregiverPatient } from "./types";

// Não existe GET /caregiver/patients/{id} — a página de detalhe busca a
// lista inteira (normalmente já em cache) e resolve o vínculo aqui.
export function findPatientLink(
  links: CaregiverPatient[],
  patientId: string,
): CaregiverPatient | undefined {
  return links.find((link) => link.patient_id === patientId);
}

/** `patient_name` pode ser `null` (RLS não deixou o backend ler a linha do
 * paciente) OU `""` (leitura funcionou, mas o nome nunca foi preenchido) —
 * os dois casos usam o mesmo fallback visual neutro. */
export function patientDisplayName(link: CaregiverPatient): string {
  return link.patient_name && link.patient_name.trim().length > 0 ? link.patient_name : "Paciente";
}
