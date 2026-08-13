import { httpClient } from "@/shared/api/httpClient";
import type { WithUnlockedAchievements } from "@/shared/types/gamification";

import type { BrushingSession, BrushingZone } from "../types";

export function startBrushingSession(): Promise<BrushingSession> {
  return httpClient.post<BrushingSession>("/api/v1/brushing-sessions");
}

export function markZoneCompleted(
  sessionId: string,
  zone: BrushingZone,
): Promise<WithUnlockedAchievements<BrushingSession>> {
  return httpClient.patch<WithUnlockedAchievements<BrushingSession>>(
    `/api/v1/brushing-sessions/${sessionId}`,
    { zone },
  );
}

export function completeBrushingSession(
  sessionId: string,
): Promise<WithUnlockedAchievements<BrushingSession>> {
  return httpClient.patch<WithUnlockedAchievements<BrushingSession>>(
    `/api/v1/brushing-sessions/${sessionId}`,
    { complete: true },
  );
}
