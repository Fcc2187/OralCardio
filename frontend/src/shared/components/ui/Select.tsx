import { useId, type ReactNode, type SelectHTMLAttributes } from "react";

import { cn } from "@/shared/utils/cn";

import {
  FIELD_ERROR_MESSAGE,
  FIELD_INPUT,
  FIELD_INPUT_ERROR,
  FIELD_LABEL,
  FIELD_WRAPPER,
} from "./fieldStyles";

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "label"> {
  label: ReactNode;
  error?: string;
  children: ReactNode;
}

export function Select({ label, error, id, className, children, ...rest }: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const errorId = `${selectId}-error`;

  return (
    <div className={FIELD_WRAPPER}>
      <label className={FIELD_LABEL} htmlFor={selectId}>
        {label}
      </label>
      <select
        id={selectId}
        className={cn(FIELD_INPUT, error ? FIELD_INPUT_ERROR : "", className)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...rest}
      >
        {children}
      </select>
      {error ? (
        <span id={errorId} className={FIELD_ERROR_MESSAGE} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
