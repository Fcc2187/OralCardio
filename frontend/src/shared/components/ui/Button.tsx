import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { buildButtonClasses, type ButtonVariant } from "./buttonStyles";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", fullWidth = true, className, children, ...rest },
  ref,
) {
  return (
    <button ref={ref} className={buildButtonClasses({ variant, fullWidth, className })} {...rest}>
      {children}
    </button>
  );
});
