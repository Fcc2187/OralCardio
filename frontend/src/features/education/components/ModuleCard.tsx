import { Link } from "react-router-dom";

import { Badge } from "@/shared/components/ui/Badge";
import { cn } from "@/shared/utils/cn";

import { EDUCATION_CATEGORY_LABELS } from "../categoryLabels";
import type { EducationCategory, EducationModule } from "../types";

// Bloco de cor por categoria: os 6 módulos semeados têm `thumbnail_url`
// nulo, então o layout não pode depender de imagem.
const CATEGORY_ACCENT: Record<EducationCategory, string> = {
  mouth_heart_connection: "bg-primary",
  bacteremia: "bg-accent-amber",
  endocarditis: "bg-error",
  gingivitis: "bg-warning",
  oral_hygiene_techniques: "bg-accent-teal",
  medication_interactions: "bg-success",
};

interface ModuleCardProps {
  module: EducationModule;
}

export function ModuleCard({ module }: ModuleCardProps) {
  return (
    <Link
      to={`/educacao/${module.slug}`}
      className="flex items-center gap-md rounded-lg border border-hairline bg-canvas p-md"
    >
      {module.thumbnail_url ? (
        <img
          src={module.thumbnail_url}
          alt=""
          className="size-12 shrink-0 rounded-md object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className={cn("size-12 shrink-0 rounded-md", CATEGORY_ACCENT[module.category])}
        />
      )}
      <div className="flex flex-1 flex-col gap-xxs">
        <p className="font-display text-title-md">{module.title}</p>
        <p className="font-body text-body-sm text-muted">{module.description}</p>
        <p className="font-body text-caption text-muted">
          {EDUCATION_CATEGORY_LABELS[module.category]} · {module.estimated_minutes} min
        </p>
      </div>
      <Badge variant={module.is_completed ? "coral" : "neutral"}>
        {module.is_completed ? "Concluído" : module.is_started ? "Em andamento" : "Novo"}
      </Badge>
    </Link>
  );
}
