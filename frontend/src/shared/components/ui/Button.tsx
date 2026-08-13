import type { ButtonHTMLAttributes, ReactNode } from "react";

import { buildButtonClasses, type ButtonVariant } from "./buttonStyles";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  fullWidth = true,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button className={buildButtonClasses({ variant, fullWidth, className })} {...rest}>
      {children}
    </button>
  );
}
