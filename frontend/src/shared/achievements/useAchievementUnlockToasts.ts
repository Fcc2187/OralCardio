import { useCallback, useEffect, useRef, useState } from "react";

import type { AchievementReveal } from "@/shared/types/gamification";

const AUTO_DISMISS_MS = 6000;

export interface AchievementToast {
  toastId: string;
  ownerId: string;
  achievement: AchievementReveal;
}

/** Fila de notificações "conquista desbloqueada". Cada conquista anunciada
 * some sozinha após alguns segundos, mas também pode ser fechada na mão. */
export function useAchievementUnlockToasts(
  onDismissed: (achievement: AchievementReveal, ownerId?: string) => void,
  isPageVisible = true,
) {
  const [toasts, setToasts] = useState<AchievementToast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback(
    (toastId: string) => {
      const dismissed = toasts.find((toast) => toast.toastId === toastId);
      if (dismissed) {
        if (dismissed.ownerId) onDismissed(dismissed.achievement, dismissed.ownerId);
        else onDismissed(dismissed.achievement);
      }
      setToasts((current) => current.filter((toast) => toast.toastId !== toastId));
    },
    [onDismissed, toasts],
  );

  useEffect(() => {
    const active = toasts[0];
    if (!active || !isPageVisible) return undefined;
    const timeoutId = setTimeout(() => dismiss(active.toastId), AUTO_DISMISS_MS);
    return () => clearTimeout(timeoutId);
  }, [dismiss, isPageVisible, toasts]);

  const announce = useCallback(
    (ownerIdOrAchievements: string | AchievementReveal[], maybeAchievements?: AchievementReveal[]) => {
      const ownerId = typeof ownerIdOrAchievements === "string" ? ownerIdOrAchievements : "";
      const achievements = typeof ownerIdOrAchievements === "string"
        ? maybeAchievements ?? []
        : ownerIdOrAchievements;
      if (achievements.length === 0) return;

      const newToasts = achievements.map((achievement) => ({
        toastId: `${achievement.id}-${nextId.current++}`,
        ownerId,
        achievement,
      }));

      setToasts((current) => [...current, ...newToasts]);

    },
    [],
  );

  const reset = useCallback(() => setToasts([]), []);

  return { toasts: toasts.slice(0, 1), announce, dismiss, reset };
}
