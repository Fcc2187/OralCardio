import { httpClient } from "@/shared/api/httpClient";
import type { HealthProfile } from "@/shared/types/healthProfile";

export const healthProfileQueryKey = ["health-profile"] as const;

export function fetchHealthProfile(): Promise<HealthProfile | null> {
  return httpClient.get<HealthProfile | null>("/api/v1/health-profile");
}
