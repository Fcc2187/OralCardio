import { httpClient } from "@/shared/api/httpClient";

export interface HealthStatus {
  api: boolean;
  database: boolean;
}

export function fetchHealthStatus(): Promise<HealthStatus> {
  return httpClient.get<HealthStatus>("/api/v1/health");
}
