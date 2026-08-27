import { useState } from "react";

import { TextField, type TextFieldProps } from "@/shared/components/ui/TextField";

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
          className="flex min-h-tap-target-min min-w-tap-target-min items-center justify-center rounded-sm text-primary-action"
          aria-label={actionLabel}
          onClick={() => setIsVisible((current) => !current)}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current stroke-2">
            {isVisible ? (
              <>
                <path d="m3 3 18 18" />
                <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5.4 0 9.3 5.1 9.3 8s-1.5 4.4-3.6 5.8" />
                <path d="M6.2 6.2C4.1 7.6 2.7 9.8 2.7 12c0 2.9 3.9 8 9.3 8 1 0 2-.2 2.9-.6" />
              </>
            ) : (
              <>
                <path d="M2.7 12S6.6 4 12 4s9.3 8 9.3 8-3.9 8-9.3 8-9.3-8-9.3-8Z" />
                <circle cx="12" cy="12" r="3" />
              </>
            )}
          </svg>
        </button>
      }
    />
  );
}
