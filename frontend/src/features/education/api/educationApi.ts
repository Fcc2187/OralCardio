import { httpClient } from "@/shared/api/httpClient";
import type { WithUnlockedAchievements } from "@/shared/types/gamification";

import type { EducationModule } from "../types";

export function fetchModules(): Promise<EducationModule[]> {
  return httpClient.get<EducationModule[]>("/api/v1/education/modules");
}

export function fetchModuleBySlug(slug: string): Promise<EducationModule> {
  return httpClient.get<EducationModule>(`/api/v1/education/modules/${slug}`);
}

export function startModule(moduleId: string): Promise<EducationModule> {
  return httpClient.post<EducationModule>(`/api/v1/education/modules/${moduleId}/start`);
}

export function completeModule(
  moduleId: string,
  readTimeSeconds: number,
): Promise<WithUnlockedAchievements<EducationModule>> {
  return httpClient.post<WithUnlockedAchievements<EducationModule>>(
    `/api/v1/education/modules/${moduleId}/complete`,
    { read_time_seconds: readTimeSeconds },
  );
}
