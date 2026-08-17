import { httpClient } from "@/shared/api/httpClient";
import type { HealthProfile, HealthProfileInput } from "@/shared/types/healthProfile";

export function submitHealthProfile(
  input: HealthProfileInput,
): Promise<HealthProfile> {
  return httpClient.put<HealthProfile>("/api/v1/health-profile", input);
}
