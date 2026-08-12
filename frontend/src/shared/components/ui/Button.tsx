import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/utils/cn";

type ButtonVariant = "primary" | "secondary" | "text";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-action text-on-primary active:not-disabled:bg-primary-pressed disabled:bg-primary-disabled disabled:text-muted",
  secondary:
    "bg-canvas text-ink border border-hairline active:not-disabled:bg-surface-soft disabled:text-muted disabled:border-hairline",
  text: "bg-transparent text-primary-action min-w-tap-target-min px-md disabled:text-muted",
};

export function Button({
  variant = "primary",
  fullWidth = true,
  className,
  children,
  ...rest
}: ButtonProps) {
  const widthClass = variant === "text" ? "w-auto" : fullWidth ? "w-full" : "w-auto";

  return (
    <button
      className={cn(
        "inline-flex min-h-tap-target-min items-center justify-center gap-xs rounded-md px-lg py-sm font-body text-body-md font-medium leading-none transition-colors duration-150 disabled:cursor-not-allowed",
        VARIANT_CLASSES[variant],
        widthClass,
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
