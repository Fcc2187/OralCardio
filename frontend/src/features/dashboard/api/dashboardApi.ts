import { httpClient } from "@/shared/api/httpClient";

export interface DashboardSummary {
  full_name: string;
  health_profile_completed: boolean;
  brushed_today: boolean;
  flossed_today: boolean;
  current_streak_days: number;
  total_points: number;
  level: number;
  level_name: string;
}

export function fetchDashboard(): Promise<DashboardSummary> {
  return httpClient.get<DashboardSummary>("/api/v1/dashboard");
}
