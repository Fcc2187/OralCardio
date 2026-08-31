import { ShieldCheck } from "lucide-react";

import { cn } from "@/shared/utils/cn";

interface BrushingProgressCardProps {
  progressPercent: number;
  className?: string;
}

export function BrushingProgressCard({
  progressPercent,
  className,
}: BrushingProgressCardProps) {
  const cleanPercent = Math.min(100, Math.max(0, Math.round(progressPercent)));
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (cleanPercent / 100) * circumference;

  return (
    <div
      role="progressbar"
      aria-valuenow={cleanPercent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Progresso da escovação"
      className={cn(
        "flex items-center justify-between rounded-2xl border border-hairline-soft bg-white p-5 shadow-xs min-[1024px]:p-6",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-action/10 text-primary-action min-[1024px]:size-14"
          aria-hidden="true"
        >
          <ShieldCheck className="size-6 stroke-[1.8]" />
        </div>
        <div className="flex flex-col">
          <h3 className="font-display text-[1.25rem] font-normal leading-tight text-ink min-[1024px]:text-[1.35rem]">
            Escovação completa
          </h3>
          <p className="mt-1 font-body text-body-sm text-muted">
            Muito bem! Continue assim todos os dias.
          </p>
        </div>
      </div>

      <div className="relative flex size-14 shrink-0 items-center justify-center">
        <svg className="size-full -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
          <circle
            cx="24"
            cy="24"
            r={radius}
            className="fill-none stroke-canvas"
            strokeWidth="3.5"
          />
          <circle
            cx="24"
            cy="24"
            r={radius}
            className="fill-none stroke-primary-action transition-all duration-300 ease-out"
            strokeWidth="3.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute font-body text-body-xs font-semibold text-ink">
          {cleanPercent}%
        </span>
      </div>
    </div>
  );
}
