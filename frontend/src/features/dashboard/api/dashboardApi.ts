import { HttpContractError, httpClient, type HttpRequestOptions } from "@/shared/api/httpClient";

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

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string") throw new HttpContractError(`/api/v1/dashboard (${field})`);
  return value;
}

function requireFiniteNonNegativeNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new HttpContractError(`/api/v1/dashboard (${field})`);
  }
  return value;
}

function requireBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") throw new HttpContractError(`/api/v1/dashboard (${field})`);
  return value;
}

export function parseDashboardSummary(response: unknown): DashboardSummaryResponse {
  if (typeof response !== "object" || response === null) throw new HttpContractError("/api/v1/dashboard");
  const value = response as Record<string, unknown>;
  const brushingsToday = value.brushings_today;
  const flossingsToday = value.flossings_today;
  return {
    full_name: requireString(value.full_name, "full_name"),
    health_profile_completed: requireBoolean(value.health_profile_completed, "health_profile_completed"),
    brushed_today: requireBoolean(value.brushed_today, "brushed_today"),
    flossed_today: typeof value.flossed_today === "boolean" ? value.flossed_today : false,
    current_streak_days: requireFiniteNonNegativeNumber(value.current_streak_days, "current_streak_days"),
    total_points: requireFiniteNonNegativeNumber(value.total_points, "total_points"),
    level: requireFiniteNonNegativeNumber(value.level, "level"),
    level_name: requireString(value.level_name, "level_name"),
    ...(typeof brushingsToday === "number" ? { brushings_today: brushingsToday } : {}),
    ...(typeof flossingsToday === "number" ? { flossings_today: flossingsToday } : {}),
  };
}

export function normalizeDashboardSummary(response: DashboardSummaryResponse): DashboardSummary {
  return {
    ...response,
    brushings_today: normalizeDailyCount(response.brushings_today, response.brushed_today),
    flossings_today: normalizeDailyCount(response.flossings_today, response.flossed_today),
  };
}

export async function fetchDashboard(options?: HttpRequestOptions): Promise<DashboardSummary> {
  const response = await httpClient.get<unknown>("/api/v1/dashboard", options);
  return normalizeDashboardSummary(parseDashboardSummary(response));
}
