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

export interface ModuleVideoBlock {
  type: "video";
  title: string;
  src: string;
}

/** O conteúdo vindo do banco é texto. Vídeos locais são acrescentados pela
 * tela do módulo após esse conteúdo ter sido validado. */
export type ModuleContentBlock = ModuleTextBlock | ModuleVideoBlock;
