import { httpClient } from "@/shared/api/httpClient";

import type { BrushingSession, BrushingZone } from "../types";

export function startBrushingSession(): Promise<BrushingSession> {
  return httpClient.post<BrushingSession>("/api/v1/brushing-sessions");
}

export function markZoneCompleted(
  sessionId: string,
  zone: BrushingZone,
): Promise<BrushingSession> {
  return httpClient.patch<BrushingSession>(
    `/api/v1/brushing-sessions/${sessionId}`,
    { zone },
  );
}

export function completeBrushingSession(
  sessionId: string,
): Promise<BrushingSession> {
  return httpClient.patch<BrushingSession>(
    `/api/v1/brushing-sessions/${sessionId}`,
    { complete: true },
  );
}
