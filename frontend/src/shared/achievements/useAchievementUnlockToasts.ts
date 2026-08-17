import { useCallback, useEffect, useRef, useState } from "react";

import type { AchievementReveal } from "@/shared/types/gamification";

const AUTO_DISMISS_MS = 6000;

export interface AchievementToast {
  toastId: string;
  achievement: AchievementReveal;
}

/** Fila de notificações "conquista desbloqueada". Cada conquista anunciada
 * some sozinha após alguns segundos, mas também pode ser fechada na mão. */
export function useAchievementUnlockToasts(onDismissed: (achievement: AchievementReveal) => void) {
  const [toasts, setToasts] = useState<AchievementToast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback(
    (toastId: string) => {
      const dismissed = toasts.find((toast) => toast.toastId === toastId);
      if (dismissed) onDismissed(dismissed.achievement);
      setToasts((current) => current.filter((toast) => toast.toastId !== toastId));
    },
    [onDismissed, toasts],
  );

  useEffect(() => {
    const active = toasts[0];
    if (!active) return undefined;
    const timeoutId = setTimeout(() => dismiss(active.toastId), AUTO_DISMISS_MS);
    return () => clearTimeout(timeoutId);
  }, [dismiss, toasts]);

  const announce = useCallback(
    (achievements: AchievementReveal[]) => {
      if (achievements.length === 0) return;

      const newToasts = achievements.map((achievement) => ({
        toastId: `${achievement.id}-${nextId.current++}`,
        achievement,
      }));

      setToasts((current) => [...current, ...newToasts]);

    },
    [],
  );

  return { toasts: toasts.slice(0, 1), announce, dismiss };
}
