import { CheckCircle2, Clock } from "lucide-react";

import { EDUCATION_CATEGORY_LABELS } from "../categoryLabels";
import { getEducationModuleMedia } from "../moduleMedia";
import { safeThumbnailUrl } from "../safeThumbnailUrl";
import type { EducationModule } from "../types";

interface ModuleHeroProps {
  module: EducationModule;
}

export function ModuleHero({ module }: ModuleHeroProps) {
  const localMedia = getEducationModuleMedia(module.slug);
  const resolvedImage =
    safeThumbnailUrl(module.thumbnail_url) ?? localMedia?.imageSrc ?? null;

  return (
    <article className="rounded-2xl border border-hairline-soft bg-white p-6 shadow-xs min-[1024px]:p-8">
      <div className="flex flex-col items-center gap-6 min-[640px]:flex-row min-[640px]:items-start min-[640px]:gap-7">
        {/* Ilustração Circular Central */}
        <div className="relative size-24 shrink-0 overflow-hidden rounded-full border border-hairline-soft bg-canvas p-1 min-[640px]:size-28 min-[1024px]:size-32">
          {resolvedImage ? (
            <img
              src={resolvedImage}
              alt=""
              aria-hidden="true"
              className="size-full rounded-full object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex size-full items-center justify-center rounded-full bg-primary-action/10 text-primary-action"
            >
              <Clock className="size-8 stroke-[1.8]" />
            </div>
          )}
        </div>

        {/* Informações do Módulo */}
        <div className="flex flex-1 flex-col items-center text-center min-[640px]:items-start min-[640px]:text-left">
          <span className="inline-flex items-center rounded-full bg-primary-action/10 px-3 py-1 font-body text-caption font-semibold text-primary-action">
            Módulo {module.order_index}
          </span>

          <h2 className="mt-2 font-display text-[1.6rem] font-normal leading-tight text-ink min-[640px]:text-[1.9rem] min-[1024px]:text-[2.2rem]">
            {module.title}
          </h2>

          <div className="mt-2 flex items-center gap-2 font-body text-body-sm text-muted">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-4 text-muted shrink-0" aria-hidden="true" />
              <span>{module.estimated_minutes} min</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>{EDUCATION_CATEGORY_LABELS[module.category]}</span>
          </div>
        </div>
      </div>

      {/* Barra de Status na base do Hero */}
      <div className="mt-6 flex items-center gap-4 rounded-xl bg-canvas p-3.5 border border-hairline-soft min-[640px]:mt-7">
        {module.is_completed ? (
          <>
            <div className="flex items-center gap-2 text-primary-action font-body text-body-sm font-semibold shrink-0">
              <CheckCircle2 className="size-5 stroke-[2.2]" aria-hidden="true" />
              <span>Módulo concluído</span>
            </div>
            <div
              aria-hidden="true"
              className="h-2 flex-1 rounded-full bg-primary-action"
            />
          </>
        ) : localMedia?.videoSrc ? (
          <div className="flex items-center gap-2 text-muted font-body text-body-sm">
            <Clock className="size-4 text-primary-action shrink-0" aria-hidden="true" />
            <span>Assista ao vídeo para concluir</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted font-body text-body-sm">
            <Clock className="size-4 text-primary-action shrink-0" aria-hidden="true" />
            <span>Vídeo em breve.</span>
          </div>
        )}
      </div>
    </article>
  );
}
