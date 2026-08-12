import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/utils/cn";

type BadgeVariant = "neutral" | "coral";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: "bg-surface-soft text-body-strong",
  coral: "bg-primary text-on-primary",
};

export function Badge({ variant = "neutral", className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-sm py-xxs font-body text-badge font-medium leading-none",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
