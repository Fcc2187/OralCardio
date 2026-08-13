import type { QueryClient } from "@tanstack/react-query";

import {
  dashboardQueryKey,
  gamificationAchievementsQueryKey,
  gamificationStatsQueryKey,
} from "./queryKeys";

/** Toda mutação que pode desbloquear conquista muda os mesmos três lugares:
 * o resumo do dashboard e as duas queries de gamificação. Cada feature ainda
 * invalida sua própria lista/detalhe por cima disso — este helper cobre só
 * a tríade, de propósito, para não virar um "invalidar tudo" implícito. */
export function invalidateGamifiedQueries(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
  queryClient.invalidateQueries({ queryKey: gamificationStatsQueryKey });
  queryClient.invalidateQueries({ queryKey: gamificationAchievementsQueryKey });
}
