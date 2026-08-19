import type { AchievementToast } from "./useAchievementUnlockToasts";

interface AchievementToastStackProps {
  toasts: AchievementToast[];
  onDismiss: (toastId: string) => void;
}

/** O contêiner com aria-live precisa existir no DOM antes do conteúdo ser
 * injetado — leitores de tela não anunciam de forma confiável um live region
 * criado e populado no mesmo instante. Por isso ele é sempre renderizado,
 * mesmo vazio, em vez de um `return null`. */
export function AchievementToastStack({ toasts, onDismiss }: AchievementToastStackProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-20 flex flex-col items-center gap-sm px-md pb-md pt-[calc(var(--spacing-md)+env(safe-area-inset-top))]"
    >
      {toasts.map(({ toastId, achievement }) => (
        <button
          key={toastId}
          type="button"
          onClick={() => onDismiss(toastId)}
          aria-label={`Conquista desbloqueada: ${achievement.name}. Toque para fechar este aviso.`}
          className="flex w-full max-w-[24rem] items-center gap-md rounded-lg bg-primary p-md text-left text-on-primary shadow-soft"
        >
          <span aria-hidden="true" className="text-display-sm">
            {achievement.icon}
          </span>
          <span className="flex flex-col">
            <span className="font-body text-body-sm font-medium">Conquista desbloqueada!</span>
            <span className="font-display text-title-md">{achievement.name}</span>
            <span className="font-body text-caption">+{achievement.points_reward} pontos</span>
          </span>
        </button>
      ))}
    </div>
  );
}
