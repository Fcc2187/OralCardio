import { httpClient } from "@/shared/api/httpClient";
import type { AchievementStatus, UserStats } from "@/shared/types/gamification";

export function fetchUserStats(): Promise<UserStats> {
  return httpClient.get<UserStats>("/api/v1/gamification/stats");
}

export function fetchAchievements(): Promise<AchievementStatus[]> {
  return httpClient.get<AchievementStatus[]>("/api/v1/gamification/achievements");
}
