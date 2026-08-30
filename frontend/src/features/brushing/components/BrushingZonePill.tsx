import { RotateCw } from "lucide-react";

import { cn } from "@/shared/utils/cn";

interface BrushingZonePillProps {
  tip: string;
  angle?: string;
  className?: string;
}
export function BrushingZonePill({ tip, angle, className }: BrushingZonePillProps) {
  return (
    <div className={cn("inline-flex items-center gap-2 flex-wrap", className)}>
      <div className="inline-flex items-center gap-2 rounded-full border border-[#eddcd0] bg-[#fbf6f2] px-3.5 py-1.5 text-body transition-all duration-200">
        <RotateCw className="size-3.5 text-primary-action shrink-0 stroke-[2.2]" aria-hidden="true" />
        <span className="font-body text-caption font-medium text-body-strong leading-tight">
          {tip}
        </span>
      </div>
      {angle ? (
        <span className="inline-flex items-center justify-center rounded-full border border-[#eddcd0] bg-[#fbf6f2] px-3 py-1.5 font-body text-caption font-semibold text-body-strong">
          {angle}
        </span>
      ) : null}
    </div>
  );
}
