import { useId, type InputHTMLAttributes } from "react";

import { cn } from "@/shared/utils/cn";

import {
  FIELD_ERROR_MESSAGE,
  FIELD_HINT,
  FIELD_INPUT,
  FIELD_INPUT_ERROR,
  FIELD_LABEL,
  FIELD_WRAPPER,
} from "./fieldStyles";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function TextField({ label, error, hint, id, className, ...rest }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  return (
    <div className={FIELD_WRAPPER}>
      <label className={FIELD_LABEL} htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        className={cn(FIELD_INPUT, error ? FIELD_INPUT_ERROR : "", className)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        {...rest}
      />
      {error ? (
        <span id={errorId} className={FIELD_ERROR_MESSAGE} role="alert">
          {error}
        </span>
      ) : hint ? (
        <span id={hintId} className={FIELD_HINT}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}
