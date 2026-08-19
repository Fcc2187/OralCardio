import { useEffect, useRef, useState } from "react";

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
}: ConfirmActionProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const questionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isConfirming) questionRef.current?.focus();
  }, [isConfirming]);

  if (!isConfirming) {
    return (
      <Button type="button" variant={variant} disabled={disabled} onClick={() => setIsConfirming(true)}>
        {label}
      </Button>
    );
  }

  return (
    <div ref={questionRef} tabIndex={-1} className="flex flex-col gap-sm rounded-md border border-hairline bg-surface-soft p-md outline-none">
      <p className="font-body text-body-sm text-body-strong">{question}</p>
      <div className="flex gap-sm">
        <Button
          variant="primary"
          type="button"
          fullWidth={false}
          className="flex-1"
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
          className="flex-1"
          onClick={() => setIsConfirming(false)}
        >
          {cancelLabel}
        </Button>
      </div>
    </div>
  );
}
