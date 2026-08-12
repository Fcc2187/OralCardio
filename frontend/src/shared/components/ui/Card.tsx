import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/utils/cn";

type CardVariant = "cream" | "canvas" | "dark" | "coral";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<CardVariant, string> = {
  cream: "bg-surface-card text-ink",
  canvas: "bg-canvas text-ink border border-hairline",
  dark: "bg-surface-dark text-on-dark",
  coral: "bg-primary text-on-primary",
};

export function Card({ variant = "cream", className, children, ...rest }: CardProps) {
  return (
    <div className={cn("rounded-lg p-lg", VARIANT_CLASSES[variant], className)} {...rest}>
      {children}
    </div>
  );
}
