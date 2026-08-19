import { describe, expect, it } from "vitest";

import { parseDashboardSummary, normalizeDashboardSummary } from "./dashboardApi";

const LEGACY_SUMMARY = {
  full_name: "Maria Silva",
  health_profile_completed: true,
  brushed_today: true,
  flossed_today: false,
  current_streak_days: 2,
  total_points: 15,
  level: 1,
  level_name: "Semente",
};

describe("normalizeDashboardSummary", () => {
  it("converte os booleanos legados quando os contadores não existem", () => {
    expect(normalizeDashboardSummary(LEGACY_SUMMARY)).toMatchObject({
      brushings_today: 1,
      flossings_today: 0,
    });
  });

  it("preserva contadores válidos retornados pela API atual", () => {
    expect(
      normalizeDashboardSummary({
        ...LEGACY_SUMMARY,
        brushings_today: 3,
        flossings_today: 4,
      }),
    ).toMatchObject({ brushings_today: 3, flossings_today: 4 });
  });

  it("rejects a malformed API response at the boundary", () => {
    expect(() => parseDashboardSummary({ ...LEGACY_SUMMARY, full_name: null })).toThrow(
      "formato esperado",
    );
  });
});
