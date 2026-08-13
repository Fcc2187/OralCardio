import type { EducationCategory } from "./types";

// Record exaustivo: um novo valor no enum do backend vira erro de
// compilação aqui em vez de renderizar uma categoria em branco.
export const EDUCATION_CATEGORY_LABELS: Record<EducationCategory, string> = {
  mouth_heart_connection: "Conexão boca-coração",
  bacteremia: "Bacteremia",
  endocarditis: "Endocardite",
  gingivitis: "Gengivite",
  oral_hygiene_techniques: "Técnicas de higiene bucal",
  medication_interactions: "Interação medicamentosa",
};
