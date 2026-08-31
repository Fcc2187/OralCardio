import { Clock, LayoutGrid } from "lucide-react";

import { cn } from "@/shared/utils/cn";

interface BrushingMetricsHeaderProps {
  completedCount: number;
  totalZones?: number;
  totalDuration?: string;
  className?: string;
}

export function BrushingMetricsHeader({
  completedCount,
  totalZones = 5,
  totalDuration = "2:00",
  className,
}: BrushingMetricsHeaderProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-4 min-[1024px]:gap-6", className)}>
      {/* Card 1: Tempo Total */}
      <div className="flex items-center gap-3.5 rounded-2xl border border-hairline-soft bg-white p-4 shadow-xs min-[1024px]:p-5">
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-action/10 text-primary-action min-[1024px]:size-12"
          aria-hidden="true"
        >
          <Clock className="size-5 stroke-[1.8]" />
        </div>
        <div className="flex flex-col">
          <span className="font-display text-[1.4rem] font-normal leading-tight text-ink min-[1024px]:text-[1.65rem]">
            {totalDuration}
          </span>
          <span className="mt-0.5 font-body text-body-sm text-muted">Tempo total</span>
        </div>
      </div>

      {/* Card 2: Regiões */}
      <div className="flex items-center gap-3.5 rounded-2xl border border-hairline-soft bg-white p-4 shadow-xs min-[1024px]:p-5">
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-action/10 text-primary-action min-[1024px]:size-12"
          aria-hidden="true"
        >
          <LayoutGrid className="size-5 stroke-[1.8]" />
        </div>
        <div className="flex flex-col">
          <span className="font-display text-[1.4rem] font-normal leading-tight text-ink min-[1024px]:text-[1.65rem]">
            {completedCount}/{totalZones}
          </span>
          <span className="mt-0.5 font-body text-body-sm text-muted">Regiões</span>
        </div>
      </div>
    </div>
  );
}
