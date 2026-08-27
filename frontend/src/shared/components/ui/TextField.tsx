import { useId, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/shared/utils/cn";

import {
  FIELD_ERROR_MESSAGE,
  FIELD_HINT,
  FIELD_CONTROL,
  FIELD_INPUT,
  FIELD_INPUT_ERROR,
  FIELD_INPUT_WITH_LEADING_ICON,
  FIELD_INPUT_WITH_TRAILING_ACTION,
  FIELD_LABEL,
  FIELD_LEADING_ICON,
  FIELD_TRAILING_ACTION,
  FIELD_WRAPPER,
} from "./fieldStyles";

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  leadingIcon?: ReactNode;
  trailingAction?: ReactNode;
}

export function TextField({
  label,
  error,
  hint,
  id,
  className,
  leadingIcon,
  trailingAction,
  "aria-describedby": ariaDescribedBy,
  ...rest
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const describedBy = [ariaDescribedBy, hint ? hintId : undefined, error ? errorId : undefined]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className={FIELD_WRAPPER}>
      <label className={FIELD_LABEL} htmlFor={inputId}>
        {label}
      </label>
      <div className={FIELD_CONTROL}>
        {leadingIcon ? <span className={FIELD_LEADING_ICON} aria-hidden="true">{leadingIcon}</span> : null}
        <input
          id={inputId}
          className={cn(
            FIELD_INPUT,
            error ? FIELD_INPUT_ERROR : "",
            leadingIcon ? FIELD_INPUT_WITH_LEADING_ICON : "",
            trailingAction ? FIELD_INPUT_WITH_TRAILING_ACTION : "",
            className,
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...rest}
        />
        {trailingAction ? <span className={FIELD_TRAILING_ACTION}>{trailingAction}</span> : null}
      </div>
      {hint ? <span id={hintId} className={FIELD_HINT}>{hint}</span> : null}
      {error ? (
        <span id={errorId} className={FIELD_ERROR_MESSAGE} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
