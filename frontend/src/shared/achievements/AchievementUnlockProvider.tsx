import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/shared/auth/authContext";
import {
  acknowledgeAchievementReveals,
  claimAchievementReveals,
} from "@/shared/api/gamificationApi";
import {
  achievementRevealsQueryKey,
  gamificationAchievementsQueryKey,
} from "@/shared/api/queryKeys";
import type { AchievementReveal } from "@/shared/types/gamification";

import { AchievementToastStack } from "./AchievementToastStack";
import { useAchievementUnlockToasts } from "./useAchievementUnlockToasts";

const SAO_PAULO_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const REVEAL_LEASE_MS = 15 * 60 * 1000;

function saoPauloDateKey(): string {
  return SAO_PAULO_DATE_FORMATTER.format(new Date());
}

/** Reivindica e monta a fila de conquistas uma única vez no topo da árvore.
 * Fica fora de `AppShell` porque o questionário de saúde também pode atingir
 * conquistas e é renderizado fora dele. */
export function AchievementUnlockProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const announcedIds = useRef(new Set<string>());
  const retryTimeouts = useRef<number[]>([]);
  const activeUserId = session?.user.id;

  const acknowledgeMutation = useMutation({
    mutationFn: (achievement: AchievementReveal) =>
      acknowledgeAchievementReveals([achievement.id]),
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
    onError: (_error, achievement) => {
      announcedIds.current.delete(achievement.id);
      const timeoutId = window.setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: achievementRevealsQueryKey(activeUserId) });
      }, REVEAL_LEASE_MS + 1000);
      retryTimeouts.current.push(timeoutId);
    },
  });
  const handleDismissed = useCallback(
    (achievement: AchievementReveal) => acknowledgeMutation.mutate(achievement),
    [acknowledgeMutation],
  );
  const { toasts, announce, dismiss } = useAchievementUnlockToasts(handleDismissed);

  const revealsQuery = useQuery({
    queryKey: achievementRevealsQueryKey(activeUserId),
    queryFn: claimAchievementReveals,
    enabled: Boolean(activeUserId),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    announcedIds.current.clear();
  }, [activeUserId]);

  useEffect(() => {
    if (!activeUserId) return;
    const unannounced = (revealsQuery.data ?? []).filter(
      (achievement) => !announcedIds.current.has(achievement.id),
    );
    if (unannounced.length === 0) return;
    for (const achievement of unannounced) announcedIds.current.add(achievement.id);
    announce(unannounced);
    queryClient.setQueryData(achievementRevealsQueryKey(activeUserId), []);
    queryClient.invalidateQueries({ queryKey: gamificationAchievementsQueryKey });
  }, [activeUserId, announce, queryClient, revealsQuery.data]);

  useEffect(() => {
    if (!activeUserId) return undefined;

    let currentDate = saoPauloDateKey();
    const intervalId = window.setInterval(() => {
      const nextDate = saoPauloDateKey();
      if (nextDate !== currentDate) {
        currentDate = nextDate;
        queryClient.invalidateQueries({
          queryKey: achievementRevealsQueryKey(activeUserId),
        });
      }
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, [activeUserId, queryClient]);

  useEffect(
    () => () => {
      for (const timeoutId of retryTimeouts.current) window.clearTimeout(timeoutId);
    },
    [],
  );

  return (
    <>
      {children}
      <AchievementToastStack toasts={toasts} onDismiss={dismiss} />
    </>
  );
}
