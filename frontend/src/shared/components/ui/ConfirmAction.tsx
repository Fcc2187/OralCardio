import { useEffect, useRef, useState, type ReactNode } from "react";

import { Button } from "./Button";
import type { ButtonVariant } from "./buttonStyles";

interface ConfirmActionProps {
  label: string;
  question: string;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  icon?: ReactNode;
  className?: string;
}

/** Confirmação inline em dois passos. Deliberadamente não usa
 * `window.confirm` (sem estilo, ~13px, ignora o piso de 44px e pode ser
 * suprimido no Safari do iOS) nem um modal (excesso de engenharia para uma
 * ação com uma linha de texto). */
export function ConfirmAction({
  label,
  question,
  onConfirm,
  confirmLabel = "Sim",
  cancelLabel = "Voltar",
  variant = "secondary",
  disabled = false,
  icon,
  className,
}: ConfirmActionProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isConfirming) confirmButtonRef.current?.focus();
  }, [isConfirming]);

  if (!isConfirming) {
    return (
      <Button
        type="button"
        variant={variant}
        disabled={disabled}
        className={className}
        onClick={() => setIsConfirming(true)}
      >
        {icon}
        {label}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-hairline-soft bg-surface-soft p-4 shadow-xs">
      <p className="font-body text-body-sm font-medium text-body-strong">{question}</p>
      <div className="flex gap-2">
        <Button
          ref={confirmButtonRef}
          variant="primary"
          type="button"
          fullWidth={false}
          className="flex-1 rounded-xl"
          disabled={disabled}
          onClick={() => {
            setIsConfirming(false);
            onConfirm();
          }}
        >
          {confirmLabel}
        </Button>
        <Button
          variant="secondary"
          type="button"
          fullWidth={false}
          className="flex-1 rounded-xl"
          onClick={() => setIsConfirming(false)}
        >
          {cancelLabel}
        </Button>
      </div>
    </div>
  );
}
