import { httpClient } from "@/shared/api/httpClient";

export interface DashboardSummary {
  full_name: string;
  health_profile_completed: boolean;
  brushed_today: boolean;
  flossed_today: boolean;
  brushings_today: number;
  flossings_today: number;
  current_streak_days: number;
  total_points: number;
  level: number;
  level_name: string;
}

type DashboardSummaryResponse = Omit<
  DashboardSummary,
  "brushings_today" | "flossings_today"
> &
  Partial<Pick<DashboardSummary, "brushings_today" | "flossings_today">>;

function normalizeDailyCount(value: number | undefined, legacyCompleted: boolean): number {
  return value !== undefined && Number.isInteger(value) && value >= 0
    ? value
    : Number(legacyCompleted);
}

export function normalizeDashboardSummary(response: DashboardSummaryResponse): DashboardSummary {
  return {
    ...response,
    brushings_today: normalizeDailyCount(response.brushings_today, response.brushed_today),
    flossings_today: normalizeDailyCount(response.flossings_today, response.flossed_today),
  };
}

export async function fetchDashboard(): Promise<DashboardSummary> {
  const response = await httpClient.get<DashboardSummaryResponse>("/api/v1/dashboard");
  return normalizeDashboardSummary(response);
}
