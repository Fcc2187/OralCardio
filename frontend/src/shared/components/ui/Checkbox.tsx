import { useId, type InputHTMLAttributes } from "react";

import { cn } from "@/shared/utils/cn";

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Checkbox({ label, id, className, ...rest }: CheckboxProps) {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;

  return (
    <label
      className="flex min-h-tap-target-min cursor-pointer items-center gap-sm"
      htmlFor={checkboxId}
    >
      <input
        id={checkboxId}
        type="checkbox"
        className={cn("size-[22px] shrink-0 accent-primary-action", className)}
        {...rest}
      />
      <span className="font-body text-body-md text-body">{label}</span>
    </label>
  );
}
