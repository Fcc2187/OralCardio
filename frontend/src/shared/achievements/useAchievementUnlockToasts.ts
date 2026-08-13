import { useCallback, useEffect, useRef, useState } from "react";

import type { UnlockedAchievement } from "@/shared/types/gamification";

const AUTO_DISMISS_MS = 6000;

export interface AchievementToast {
  toastId: string;
  achievement: UnlockedAchievement;
}

/** Fila de notificações "conquista desbloqueada". Cada conquista anunciada
 * some sozinha após alguns segundos, mas também pode ser fechada na mão. */
export function useAchievementUnlockToasts() {
  const [toasts, setToasts] = useState<AchievementToast[]>([]);
  const nextId = useRef(0);
  const timeoutIds = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const pending = timeoutIds.current;
    return () => {
      for (const id of pending) clearTimeout(id);
    };
  }, []);

  const dismiss = useCallback((toastId: string) => {
    setToasts((current) => current.filter((toast) => toast.toastId !== toastId));
  }, []);

  const announce = useCallback(
    (achievements: UnlockedAchievement[]) => {
      if (achievements.length === 0) return;

      const newToasts = achievements.map((achievement) => ({
        toastId: `${achievement.id}-${nextId.current++}`,
        achievement,
      }));

      setToasts((current) => [...current, ...newToasts]);

      for (const toast of newToasts) {
        const timeoutId = setTimeout(() => {
          timeoutIds.current.delete(timeoutId);
          dismiss(toast.toastId);
        }, AUTO_DISMISS_MS);
        timeoutIds.current.add(timeoutId);
      }
    },
    [dismiss],
  );

  return { toasts, announce, dismiss };
}
