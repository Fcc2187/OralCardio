import { HttpContractError, httpClient, type HttpRequestOptions } from "@/shared/api/httpClient";

export interface DashboardSummary {
  full_name: string;
  brushings_today: number;
  flossings_today: number;
  current_streak_days: number;
  total_points: number;
  level: number;
  level_name: string;
  current_level_min_points: number;
  next_level_name: string | null;
  next_level_min_points: number | null;
  completed_education_modules: number;
  total_education_modules: number;
  next_appointment_at: string | null;
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

function requireNonNegativeInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new HttpContractError(`/api/v1/dashboard (${field})`);
  }
  return value;
}

function requireNullableString(value: unknown, field: string): string | null {
  if (value === null) return null;
  if (typeof value === "string") return value;
  throw new HttpContractError(`/api/v1/dashboard (${field})`);
}

function requireNullableFiniteNonNegativeNumber(value: unknown, field: string): number | null {
  if (value === null) return null;
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) return value;
  throw new HttpContractError(`/api/v1/dashboard (${field})`);
}

export function parseDashboardSummary(response: unknown): DashboardSummary {
  if (typeof response !== "object" || response === null) throw new HttpContractError("/api/v1/dashboard");
  const value = response as Record<string, unknown>;

  const nextLevelName = requireNullableString(value.next_level_name, "next_level_name");
  const nextLevelMinPoints = requireNullableFiniteNonNegativeNumber(
    value.next_level_min_points,
    "next_level_min_points",
  );

  if ((nextLevelName === null) !== (nextLevelMinPoints === null)) {
    throw new HttpContractError("/api/v1/dashboard (next_level pair mismatch)");
  }

  return {
    full_name: requireString(value.full_name, "full_name"),
    brushings_today: requireNonNegativeInteger(value.brushings_today, "brushings_today"),
    flossings_today: requireNonNegativeInteger(value.flossings_today, "flossings_today"),
    current_streak_days: requireNonNegativeInteger(value.current_streak_days, "current_streak_days"),
    total_points: requireFiniteNonNegativeNumber(value.total_points, "total_points"),
    level: requireNonNegativeInteger(value.level, "level"),
    level_name: requireString(value.level_name, "level_name"),
    current_level_min_points: requireFiniteNonNegativeNumber(
      value.current_level_min_points,
      "current_level_min_points",
    ),
    next_level_name: nextLevelName,
    next_level_min_points: nextLevelMinPoints,
    completed_education_modules: requireNonNegativeInteger(
      value.completed_education_modules,
      "completed_education_modules",
    ),
    total_education_modules: requireNonNegativeInteger(
      value.total_education_modules,
      "total_education_modules",
    ),
    next_appointment_at: requireNullableString(value.next_appointment_at, "next_appointment_at"),
  };
}

export async function fetchDashboard(options?: HttpRequestOptions): Promise<DashboardSummary> {
  const response = await httpClient.get<unknown>("/api/v1/dashboard", options);
  return parseDashboardSummary(response);
}
