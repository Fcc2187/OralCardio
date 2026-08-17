import { httpClient } from "@/shared/api/httpClient";
import type { AchievementReveal, AchievementStatus, UserStats } from "@/shared/types/gamification";

export function fetchUserStats(): Promise<UserStats> {
  return httpClient.get<UserStats>("/api/v1/gamification/stats");
}

export function fetchAchievements(): Promise<AchievementStatus[]> {
  return httpClient.get<AchievementStatus[]>("/api/v1/gamification/achievements");
}

export function claimAchievementReveals(): Promise<AchievementReveal[]> {
  return httpClient.post<AchievementReveal[]>("/api/v1/gamification/achievement-reveals/claim");
}

export function acknowledgeAchievementReveals(achievementIds: string[]): Promise<void> {
  return httpClient.post<void>("/api/v1/gamification/achievement-reveals/acknowledge", {
    achievement_ids: achievementIds,
  });
}
