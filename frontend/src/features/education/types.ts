export type EducationCategory =
  | "mouth_heart_connection"
  | "bacteremia"
  | "endocarditis"
  | "gingivitis"
  | "oral_hygiene_techniques"
  | "medication_interactions";

export interface EducationModule {
  id: string;
  title: string;
  slug: string;
  description: string;
  // JSONB de admin, sem validação nem sanitização em nenhuma camada do
  // backend — nunca confiar na forma sem passar por parseModuleContent.
  content: unknown;
  category: EducationCategory;
  order_index: number;
  estimated_minutes: number;
  thumbnail_url: string | null;
  is_started: boolean;
  is_completed: boolean;
  started_at: string | null;
  completed_at: string | null;
}

export interface ModuleTextBlock {
  type: "text";
  title: string;
  body: string;
}

/** União discriminada dos blocos de conteúdo. Hoje só existe "text" nos
 * dados semeados, mas o parser (`parseModuleContent`) já descarta qualquer
 * `type` desconhecido em vez de quebrar, então novos tipos podem chegar do
 * backend sem exigir mudança aqui além de estender esta união. */
export type ModuleContentBlock = ModuleTextBlock;
