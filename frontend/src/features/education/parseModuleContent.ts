import type { ModuleContentBlock } from "./types";

function isTextBlock(value: unknown): value is ModuleContentBlock {
  if (typeof value !== "object" || value === null) return false;
  const block = value as Record<string, unknown>;
  return block.type === "text" && typeof block.title === "string" && typeof block.body === "string";
}

/** Nunca lança. `content` é JSONB de admin sem validação nem sanitização em
 * nenhuma camada do backend — qualquer forma inesperada (undefined, chave
 * ausente, tipo de bloco desconhecido) vira lista vazia, nunca um erro que
 * derruba a tela de um paciente. */
export function parseModuleContent(content: unknown): ModuleContentBlock[] {
  if (typeof content !== "object" || content === null) return [];

  const sections = (content as Record<string, unknown>).sections;
  if (!Array.isArray(sections)) return [];

  return sections.filter(isTextBlock);
}
