import { createContext, useContext, type ReactNode } from "react";

import type { UnlockedAchievement } from "@/shared/types/gamification";

import { AchievementToastStack } from "./AchievementToastStack";
import { useAchievementUnlockToasts } from "./useAchievementUnlockToasts";

type AnnounceAchievements = (achievements: UnlockedAchievement[]) => void;

const AchievementUnlockContext = createContext<AnnounceAchievements | undefined>(undefined);

/** Monta a fila de toasts de conquista uma única vez, no topo da árvore, e
 * expõe apenas a função de anunciar — nenhuma página precisa (nem deve) ver
 * `toasts`/`dismiss` diretamente. Fica fora de `AppShell` porque o
 * questionário de saúde também desbloqueia conquista e renderiza fora dele. */
export function AchievementUnlockProvider({ children }: { children: ReactNode }) {
  const { toasts, announce, dismiss } = useAchievementUnlockToasts();

  return (
    <AchievementUnlockContext.Provider value={announce}>
      {children}
      <AchievementToastStack toasts={toasts} onDismiss={dismiss} />
    </AchievementUnlockContext.Provider>
  );
}

export function useAnnounceAchievements(): AnnounceAchievements {
  const announce = useContext(AchievementUnlockContext);
  if (announce === undefined) {
    throw new Error("useAnnounceAchievements precisa ser usado dentro de um AchievementUnlockProvider");
  }
  return announce;
}
