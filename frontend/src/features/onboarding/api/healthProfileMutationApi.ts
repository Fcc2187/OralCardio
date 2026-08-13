import { httpClient } from "@/shared/api/httpClient";
import type { HealthProfile, HealthProfileInput } from "@/shared/types/healthProfile";
import type { WithUnlockedAchievements } from "@/shared/types/gamification";

export function submitHealthProfile(
  input: HealthProfileInput,
): Promise<WithUnlockedAchievements<HealthProfile>> {
  return httpClient.put<WithUnlockedAchievements<HealthProfile>>("/api/v1/health-profile", input);
}
