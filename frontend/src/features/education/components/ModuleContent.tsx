import type { ModuleContentBlock } from "../types";

interface ModuleContentProps {
  blocks: ModuleContentBlock[];
  fallbackDescription: string;
}

/** `switch` exaustivo sobre `block.type`; qualquer tipo desconhecido cai no
 * `default: return null` em vez de tentar renderizar algo. Texto puro,
 * nunca `dangerouslySetInnerHTML` — `content` é JSONB de admin sem
 * sanitização em nenhuma camada do backend. */
export function ModuleContent({ blocks, fallbackDescription }: ModuleContentProps) {
  if (blocks.length === 0) {
    return (
      <p className="whitespace-pre-line font-body text-title-md leading-relaxed text-body">
        {fallbackDescription}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-lg">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "text":
            return (
              <div key={index} className="flex flex-col gap-sm">
                <h2 className="font-display text-title-lg">{block.title}</h2>
                <p className="whitespace-pre-line font-body text-title-md leading-relaxed text-body">
                  {block.body}
                </p>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
