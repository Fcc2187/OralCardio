import type { CardiacCondition, HealthProfileInput } from "@/shared/types/healthProfile";

export interface QuestionnaireFormState {
  cardiacCondition: CardiacCondition | "";
  cardiacConditionDetail: string;
  hasPacemaker: boolean;
  hasProstheticValve: boolean;
  medicationsText: string;
  allergiesText: string;
  lastDentalVisit: string;
  brushingFrequencyBefore: string;
  dentistName: string;
  dentistPhone: string;
  cardiologistName: string;
}

export const INITIAL_QUESTIONNAIRE_STATE: QuestionnaireFormState = {
  cardiacCondition: "",
  cardiacConditionDetail: "",
  hasPacemaker: false,
  hasProstheticValve: false,
  medicationsText: "",
  allergiesText: "",
  lastDentalVisit: "",
  brushingFrequencyBefore: "",
  dentistName: "",
  dentistPhone: "",
  cardiologistName: "",
};

function splitCommaList(text: string): string[] {
  return text
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function toNullableString(text: string): string | null {
  const trimmed = text.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Traduz o estado bruto do formulário (strings de UI) para o DTO que o
 * backend espera — separado da renderização para poder ser testado sem
 * montar o componente inteiro. */
export function buildHealthProfilePayload(state: QuestionnaireFormState): HealthProfileInput {
  if (state.cardiacCondition === "") {
    throw new Error("Selecione a condição cardíaca antes de enviar.");
  }

  const brushingFrequency = state.brushingFrequencyBefore === ""
    ? null
    : Number(state.brushingFrequencyBefore);
  if (
    brushingFrequency !== null &&
    (!Number.isInteger(brushingFrequency) || brushingFrequency < 0 || brushingFrequency > 20)
  ) {
    throw new Error("Informe uma frequência de escovação entre 0 e 20.");
  }
  if (state.lastDentalVisit) {
    const parsedDate = new Date(`${state.lastDentalVisit}T12:00:00`);
    if (Number.isNaN(parsedDate.getTime()) || parsedDate.getTime() > Date.now()) {
      throw new Error("A última visita ao dentista não pode estar no futuro.");
    }
  }

  return {
    cardiac_condition: state.cardiacCondition,
    cardiac_condition_detail: toNullableString(state.cardiacConditionDetail),
    has_pacemaker: state.hasPacemaker,
    has_prosthetic_valve: state.hasProstheticValve,
    medications: splitCommaList(state.medicationsText),
    allergies: splitCommaList(state.allergiesText),
    last_dental_visit: state.lastDentalVisit || null,
    brushing_frequency_before: brushingFrequency,
    dentist_name: toNullableString(state.dentistName),
    dentist_phone: toNullableString(state.dentistPhone),
    cardiologist_name: toNullableString(state.cardiologistName),
  };
}
