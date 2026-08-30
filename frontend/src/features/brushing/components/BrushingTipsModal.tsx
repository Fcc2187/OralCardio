import { useEffect, useRef, type RefObject } from "react";
import { Sparkles, X, Check } from "lucide-react";

import { Button } from "@/shared/components/ui/Button";

interface BrushingTipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: RefObject<HTMLButtonElement | null>;
}

const TIPS = [
  {
    title: "Ângulo de 45º",
    description: "Incline as cerdas em 45º contra a linha da gengiva para remover a placa bacteriana com eficiência.",
  },
  {
    title: "Movimentos Suaves",
    description: "Faça movimentos circulares curtos e sem aplicar força excessiva, evitando agredir o esmalte e a gengiva.",
  },
  {
    title: "Tempo Adequado",
    description: "Mantenha a escovação pelos 2 minutos completos, dedicando 24 segundos a cada uma das 5 regiões.",
  },
  {
    title: "Higienize a Língua",
    description: "Finalize escovando suavemente a superfície da língua de trás para a frente para refrescar o hálito.",
  },
];

export function BrushingTipsModal({ isOpen, onClose, triggerRef }: BrushingTipsModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const triggerElement = triggerRef?.current;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      triggerElement?.focus();
    };
  }, [isOpen, onClose, triggerRef]);

  function handleTabKey(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;

    const buttons = dialogRef.current?.querySelectorAll<HTMLButtonElement>("button:not([disabled])");
    if (!buttons?.length) return;

    const firstButton = buttons[0];
    const lastButton = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === firstButton) {
      event.preventDefault();
      lastButton.focus();
    } else if (!event.shiftKey && document.activeElement === lastButton) {
      event.preventDefault();
      firstButton.focus();
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex min-h-full items-center justify-center overflow-y-auto bg-ink/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tips-modal-title"
        onKeyDown={handleTabKey}
        className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-hairline-soft/80 min-[640px]:p-7"
      >
        <div className="flex items-center justify-between pb-4 border-b border-hairline-soft/60">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-full bg-[#fbf5f0] text-primary-action" aria-hidden="true">
              <Sparkles className="size-4.5 stroke-[2]" />
            </div>
            <h2 id="tips-modal-title" className="font-display text-[1.35rem] font-semibold text-ink">
              Dicas de Escovação
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="flex size-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-card hover:text-ink"
          >
            <X className="size-5" />
          </button>
        </div>

        <ul className="mt-4 flex flex-col gap-3.5">
          {TIPS.map((tip) => (
            <li key={tip.title} className="flex items-start gap-3 rounded-xl bg-surface-card/40 p-3">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-action/15 text-primary-action mt-0.5" aria-hidden="true">
                <Check className="size-3 stroke-[2.5]" />
              </span>
              <div className="flex flex-col">
                <strong className="font-body text-body-sm font-semibold text-body-strong">
                  {tip.title}
                </strong>
                <p className="mt-0.5 font-body text-caption text-muted leading-relaxed">
                  {tip.description}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose} className="w-full min-[640px]:w-auto min-[640px]:px-8">
            Entendi
          </Button>
        </div>
      </div>
    </div>
  );
}
