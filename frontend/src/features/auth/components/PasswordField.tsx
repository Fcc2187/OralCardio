import { useState } from "react";

import { TextField, type TextFieldProps } from "@/shared/components/ui/TextField";

import { EyeIcon, EyeOffIcon } from "./AuthIcons";

type PasswordFieldProps = Omit<TextFieldProps, "type" | "trailingAction">;

export function PasswordField({ label, ...props }: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const actionLabel = isVisible ? "Ocultar senha" : "Mostrar senha";

  return (
    <TextField
      {...props}
      label={label}
      type={isVisible ? "text" : "password"}
      trailingAction={
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-sm text-muted transition-colors hover:text-ink focus-visible:text-primary-action"
          aria-label={actionLabel}
          onClick={() => setIsVisible((current) => !current)}
        >
          {isVisible ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
        </button>
      }
    />
  );
}
