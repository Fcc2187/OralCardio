import { describe, expect, it } from "vitest";

import { parseDashboardSummary } from "./dashboardApi";

const VALID_DASHBOARD_SUMMARY = {
  full_name: "Maria Silva",
  brushings_today: 1,
  flossings_today: 0,
  current_streak_days: 2,
  total_points: 2100,
  level: 4,
  level_name: "Flor",
  current_level_min_points: 1875,
  next_level_name: "Fruto",
  next_level_min_points: 3750,
  completed_education_modules: 3,
  total_education_modules: 6,
  next_appointment_at: "2026-10-15T14:30:00Z",
};

describe("parseDashboardSummary", () => {
  it("parseia com sucesso um resumo completo com próximo nível e consulta", () => {
    const parsed = parseDashboardSummary(VALID_DASHBOARD_SUMMARY);
    expect(parsed).toEqual(VALID_DASHBOARD_SUMMARY);
  });

  it("aceita estado de nível máximo quando next_level_name e next_level_min_points são ambos null", () => {
    const maxLevelSummary = {
      ...VALID_DASHBOARD_SUMMARY,
      total_points: 8200,
      level: 6,
      level_name: "Guardião do Coração",
      current_level_min_points: 7500,
      next_level_name: null,
      next_level_min_points: null,
      next_appointment_at: null,
    };
    const parsed = parseDashboardSummary(maxLevelSummary);
    expect(parsed.next_level_name).toBeNull();
    expect(parsed.next_level_min_points).toBeNull();
    expect(parsed.next_appointment_at).toBeNull();
  });

  it("rejeita quando apenas next_level_name ou next_level_min_points é null", () => {
    expect(() =>
      parseDashboardSummary({
        ...VALID_DASHBOARD_SUMMARY,
        next_level_name: "Fruto",
        next_level_min_points: null,
      }),
    ).toThrow();

    expect(() =>
      parseDashboardSummary({
        ...VALID_DASHBOARD_SUMMARY,
        next_level_name: null,
        next_level_min_points: 3750,
      }),
    ).toThrow();
  });

  it("rejeita payload malformado com campos faltando ou tipos inválidos", () => {
    expect(() => parseDashboardSummary({ ...VALID_DASHBOARD_SUMMARY, full_name: null })).toThrow();
    expect(() => parseDashboardSummary({ ...VALID_DASHBOARD_SUMMARY, total_points: -5 })).toThrow();
    expect(() => parseDashboardSummary({ ...VALID_DASHBOARD_SUMMARY, completed_education_modules: "3" })).toThrow();
    expect(() => parseDashboardSummary(null)).toThrow();
  });
});
