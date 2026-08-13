import { httpClient } from "@/shared/api/httpClient";
import type { WithUnlockedAchievements } from "@/shared/types/gamification";

export interface FlossingLog {
  id: string;
  user_id: string;
  logged_at: string;
  notes: string | null;
}

// Corpo obrigatório: FlossingLogInput não tem default no FastAPI, então uma
// requisição sem body vira 422.
export function logFlossing(notes: string | null = null): Promise<WithUnlockedAchievements<FlossingLog>> {
  return httpClient.post<WithUnlockedAchievements<FlossingLog>>("/api/v1/flossing-logs", { notes });
}
