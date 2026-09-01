import { useId, type ReactNode, type TextareaHTMLAttributes } from "react";

import { cn } from "@/shared/utils/cn";

import { FIELD_HINT, FIELD_LABEL, FIELD_TEXTAREA, FIELD_WRAPPER } from "./fieldStyles";

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "label"> {
  label: ReactNode;
  hint?: string;
}

export function Textarea({ label, hint, id, className, ...rest }: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const hintId = `${textareaId}-hint`;

  return (
    <div className={FIELD_WRAPPER}>
      <label className={FIELD_LABEL} htmlFor={textareaId}>
        {label}
      </label>
      <textarea
        id={textareaId}
        rows={3}
        className={cn(FIELD_TEXTAREA, className)}
        aria-describedby={hint ? hintId : undefined}
        {...rest}
      />
      {hint ? (
        <span id={hintId} className={FIELD_HINT}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}
