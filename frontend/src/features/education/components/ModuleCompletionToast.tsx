import { CheckCircle2, X } from "lucide-react";
import { useEffect } from "react";

interface ModuleCompletionToastProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export function ModuleCompletionToast({
  isVisible,
  onDismiss,
}: ModuleCompletionToastProps) {
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, [isVisible, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-20 z-50 flex justify-center min-[1024px]:bottom-10"
    >
      {isVisible ? (
        <div className="pointer-events-auto flex w-full max-w-sm items-center justify-between gap-3.5 rounded-2xl border border-surface-dark-soft bg-surface-dark px-4 py-3.5 text-on-dark shadow-soft min-[640px]:max-w-md">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-action text-on-primary">
            <CheckCircle2 className="size-5 stroke-[2.2]" aria-hidden="true" />
          </div>

          <span className="flex-1 font-body text-body-sm font-medium leading-snug text-on-dark">
            Vídeo concluído — módulo concluído!
          </span>

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Fechar notificação"
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-on-dark-soft transition-colors hover:text-on-dark active:scale-95 min-h-tap-target-min min-w-tap-target-min"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
