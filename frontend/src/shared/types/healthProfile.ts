export type CardiacCondition =
  | "valve_disease"
  | "congenital_heart"
  | "heart_failure"
  | "arrhythmia"
  | "coronary_artery"
  | "endocarditis_history"
  | "other";

export const CARDIAC_CONDITION_LABELS: Record<CardiacCondition, string> = {
  valve_disease: "Doença valvular",
  congenital_heart: "Cardiopatia congênita",
  heart_failure: "Insuficiência cardíaca",
  arrhythmia: "Arritmia",
  coronary_artery: "Doença arterial coronariana",
  endocarditis_history: "Histórico de endocardite",
  other: "Outro",
};

export interface HealthProfile {
  id: string;
  user_id: string;
  cardiac_condition: CardiacCondition;
  cardiac_condition_detail: string | null;
  has_pacemaker: boolean;
  has_prosthetic_valve: boolean;
  medications: string[];
  allergies: string[];
  last_dental_visit: string | null;
  brushing_frequency_before: number | null;
  dentist_name: string | null;
  dentist_phone: string | null;
  cardiologist_name: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface HealthProfileInput {
  cardiac_condition: CardiacCondition;
  cardiac_condition_detail?: string | null;
  has_pacemaker: boolean;
  has_prosthetic_valve: boolean;
  medications?: string[];
  allergies?: string[];
  last_dental_visit?: string | null;
  brushing_frequency_before?: number | null;
  dentist_name?: string | null;
  dentist_phone?: string | null;
  cardiologist_name?: string | null;
}
