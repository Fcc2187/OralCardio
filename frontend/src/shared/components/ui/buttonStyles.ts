import { cn } from "@/shared/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "text";

interface BuildButtonClassesOptions {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  className?: string;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-action text-on-primary hover:not-disabled:bg-primary-pressed active:not-disabled:bg-primary-pressed disabled:bg-primary-disabled disabled:text-muted shadow-sm",
  secondary:
    "bg-white text-ink border border-hairline hover:not-disabled:bg-surface-soft active:not-disabled:bg-surface-soft disabled:text-muted disabled:border-hairline",
  text: "bg-transparent text-primary-action min-w-tap-target-min px-md hover:underline disabled:text-muted",
};

/** Classes visuais do Button, extraídas para serem reaproveitadas por
 * qualquer elemento que precise "vestir" a aparência de botão sem ser um
 * `<button>` — como `LinkButton`, que renderiza um `<a>`. */
export function buildButtonClasses({
  variant = "primary",
  fullWidth = true,
  className,
}: BuildButtonClassesOptions = {}): string {
  const widthClass = variant === "text" ? "w-auto" : fullWidth ? "w-full" : "w-auto";

  return cn(
    "inline-flex min-h-tap-target-min items-center justify-center gap-xs rounded-lg px-lg py-sm font-body text-body-md font-medium leading-none transition-colors duration-150 disabled:cursor-not-allowed",
    VARIANT_CLASSES[variant],
    widthClass,
    className,
  );
}
