import { Check, ChevronRight, Clock } from "lucide-react";
import { Link } from "react-router-dom";

import { EDUCATION_CATEGORY_LABELS } from "../categoryLabels";
import { getEducationModuleMedia } from "../moduleMedia";
import { safeThumbnailUrl } from "../safeThumbnailUrl";
import type { EducationModule } from "../types";

interface ModuleCardProps {
  module: EducationModule;
}

export function ModuleCard({ module }: ModuleCardProps) {
  const localMedia = getEducationModuleMedia(module.slug);
  const resolvedThumbnail =
    safeThumbnailUrl(module.thumbnail_url) ?? localMedia?.imageSrc ?? null;

  const statusLabel = module.is_completed
    ? "Concluído"
    : module.is_started
      ? "Em andamento"
      : null;

  return (
    <Link
      to={`/educacao/${module.slug}`}
      className="group relative flex items-center gap-4 rounded-2xl border border-hairline-soft bg-white p-3.5 shadow-xs transition-all hover:bg-surface-soft/60 active:bg-surface-soft min-[640px]:p-5"
    >
      {/* Thumbnail */}
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-canvas min-[640px]:h-24 min-[640px]:w-36 min-[1024px]:h-28 min-[1024px]:w-44">
        {resolvedThumbnail ? (
          <img
            src={resolvedThumbnail}
            alt=""
            loading="lazy"
            aria-hidden="true"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex size-full items-center justify-center bg-primary-action/10 text-primary-action"
          >
            <Clock className="size-6 stroke-[1.8]" />
          </div>
        )}

        {/* Status icon badge on image */}
        {module.is_completed ? (
          <div
            aria-hidden="true"
            className="absolute left-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-primary-action text-on-primary shadow-2xs"
          >
            <Check className="size-3 stroke-[3]" />
          </div>
        ) : module.is_started ? (
          <div
            aria-hidden="true"
            className="absolute left-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-white/90 text-primary-action shadow-2xs backdrop-blur-xs"
          >
            <Clock className="size-3 stroke-[2.5]" />
          </div>
        ) : null}
      </div>

      {/* Conteúdo textual */}
      <div className="flex flex-1 flex-col justify-center min-w-0">
        <h3 className="font-display text-[1.15rem] font-normal leading-snug text-ink min-[640px]:text-[1.3rem]">
          {module.title}
        </h3>
        <p className="mt-1 font-body text-caption text-muted leading-relaxed line-clamp-2 min-[640px]:text-body-sm">
          {module.description}
        </p>
        <div className="mt-2 flex items-center gap-2 font-body text-caption text-muted">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5 text-muted shrink-0" aria-hidden="true" />
            <span>{module.estimated_minutes} min</span>
          </span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{EDUCATION_CATEGORY_LABELS[module.category]}</span>
        </div>
      </div>

      {/* Ações e Badges à direita */}
      <div className="flex items-center gap-3 shrink-0">
        {statusLabel ? (
          <span
            className={
              module.is_completed
                ? "inline-flex items-center gap-1.5 rounded-full bg-primary-action/10 px-2.5 py-1 font-body text-caption font-semibold text-primary-action sm:px-3"
                : "inline-flex items-center rounded-full border border-hairline-soft bg-canvas px-2.5 py-1 font-body text-caption font-medium text-body sm:px-3"
            }
          >
            {module.is_completed ? (
              <Check className="size-3.5 stroke-[2.5]" aria-hidden="true" />
            ) : null}
            <span>{statusLabel}</span>
          </span>
        ) : null}

        <ChevronRight
          className="size-5 text-muted transition-transform duration-200 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}
