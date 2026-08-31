import { cn } from "@/shared/utils/cn";

import type { EducationProgress } from "../educationProgress";

interface EducationProgressSummaryProps {
  progress: EducationProgress;
  className?: string;
}

export function EducationProgressSummary({
  progress,
  className,
}: EducationProgressSummaryProps) {
  const { completed, total, percentage } = progress;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className={cn(
        "flex flex-col gap-5 rounded-2xl border border-hairline-soft bg-white p-5 shadow-xs min-[640px]:flex-row min-[640px]:items-center min-[640px]:gap-7 min-[1024px]:p-7",
        className,
      )}
    >
      {/* Indicador Circular */}
      <div
        role="progressbar"
        aria-label="Progresso nos módulos educativos"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        className="relative flex size-28 shrink-0 items-center justify-center self-center min-[640px]:size-32"
      >
        <svg className="size-full -rotate-90" viewBox="0 0 96 96" aria-hidden="true">
          <circle
            cx="48"
            cy="48"
            r={radius}
            className="fill-none stroke-canvas"
            strokeWidth="7"
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            className="fill-none stroke-primary-action transition-all duration-500 ease-out"
            strokeWidth="7"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="font-display text-[1.4rem] font-normal leading-none text-ink min-[640px]:text-[1.6rem]">
            {percentage}%
          </span>
          <span className="mt-0.5 font-body text-[0.7rem] font-medium uppercase tracking-wider text-muted">
            concluído
          </span>
        </div>
      </div>

      {/* Textos e Barra Linear */}
      <div className="flex flex-1 flex-col justify-center">
        <h2 className="font-display text-[1.25rem] font-normal leading-tight text-ink min-[1024px]:text-[1.35rem]">
          {percentage === 100 ? "Parabéns, você concluiu tudo!" : "Continue aprendendo!"}
        </h2>
        <p className="mt-1 font-body text-body-sm text-muted leading-relaxed">
          {percentage === 100
            ? "Você finalizou todos os módulos disponíveis para o cuidado da sua saúde bucal e cardíaca."
            : "Cada módulo completo te deixa mais próximo de um sorriso saudável."}
        </p>

        {/* Barra de progresso linear */}
        <div className="mt-3.5 h-2 w-full max-w-md overflow-hidden rounded-full bg-canvas">
          <div
            className="h-full rounded-full bg-primary-action transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <p className="mt-2 font-body text-caption font-medium text-primary-action">
          {completed} de {total} módulos concluídos
        </p>
      </div>
    </div>
  );
}
