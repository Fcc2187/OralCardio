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
    <div className={cn("grid grid-cols-2 gap-4", className)}>
      {/* Card 1: Tempo Total */}
      <div className="flex items-center gap-3.5 rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-hairline-soft/80 min-[640px]:p-5">
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#fbf5f0] border border-[#eddcd0] text-primary-action"
          aria-hidden="true"
        >
          <Clock className="size-5 stroke-[2]" />
        </div>
        <div className="flex flex-col">
          <span className="font-display text-[1.35rem] font-bold leading-tight text-ink min-[640px]:text-[1.55rem]">
            {totalDuration}
          </span>
          <span className="font-body text-caption text-muted">Tempo total</span>
        </div>
      </div>

      {/* Card 2: Regiões */}
      <div className="flex items-center gap-3.5 rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-hairline-soft/80 min-[640px]:p-5">
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#fbf5f0] border border-[#eddcd0] text-primary-action"
          aria-hidden="true"
        >
          <LayoutGrid className="size-5 stroke-[2]" />
        </div>
        <div className="flex flex-col">
          <span className="font-display text-[1.35rem] font-bold leading-tight text-ink min-[640px]:text-[1.55rem]">
            {completedCount}/{totalZones}
          </span>
          <span className="font-body text-caption text-muted">Regiões</span>
        </div>
      </div>
    </div>
  );
}
