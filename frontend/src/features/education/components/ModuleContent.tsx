import { Sparkles } from "lucide-react";

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
  const textBlocks = blocks.filter(
    (b): b is Extract<ModuleContentBlock, { type: "text" }> => b.type === "text",
  );

  if (textBlocks.length === 0) {
    return (
      <div className="rounded-2xl border border-hairline-soft bg-white p-6 shadow-xs min-[1024px]:p-8">
        <p className="whitespace-pre-line font-body text-body-md leading-relaxed text-body">
          {fallbackDescription}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 min-[640px]:gap-6">
      {textBlocks.map((block, index) => {
        const isIntroCard = index === 0;

        return (
          <div
            key={index}
            className="rounded-2xl border border-hairline-soft bg-white p-6 shadow-xs min-[1024px]:p-8"
          >
            <div className="flex items-start gap-4">
              {isIntroCard ? (
                <div
                  aria-hidden="true"
                  className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary-action/10 text-primary-action min-[1024px]:size-12"
                >
                  <Sparkles className="size-5 stroke-[1.8]" />
                </div>
              ) : null}

              <div className="flex-1">
                <h3 className="font-display text-[1.25rem] font-normal leading-tight text-ink min-[1024px]:text-[1.35rem]">
                  {block.title}
                </h3>
                <p className="mt-2 whitespace-pre-line font-body text-body-md leading-relaxed text-body">
                  {block.body}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
