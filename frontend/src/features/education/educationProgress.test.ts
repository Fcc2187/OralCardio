import { describe, expect, it } from "vitest";

import { calculateEducationProgress } from "./educationProgress";

describe("calculateEducationProgress", () => {
  it("lida com lista vazia sem divisão por zero", () => {
    expect(calculateEducationProgress([])).toEqual({
      completed: 0,
      total: 0,
      percentage: 0,
    });
  });

  it("calcula zero de seis módulos concluídos", () => {
    const modules = [
      { is_completed: false },
      { is_completed: false },
      { is_completed: false },
      { is_completed: false },
      { is_completed: false },
      { is_completed: false },
    ];
    expect(calculateEducationProgress(modules)).toEqual({
      completed: 0,
      total: 6,
      percentage: 0,
    });
  });

  it("calcula três de seis módulos concluídos (50%)", () => {
    const modules = [
      { is_completed: true },
      { is_completed: true },
      { is_completed: true },
      { is_completed: false },
      { is_completed: false },
      { is_completed: false },
    ];
    expect(calculateEducationProgress(modules)).toEqual({
      completed: 3,
      total: 6,
      percentage: 50,
    });
  });

  it("calcula seis de seis módulos concluídos (100%)", () => {
    const modules = [
      { is_completed: true },
      { is_completed: true },
      { is_completed: true },
      { is_completed: true },
      { is_completed: true },
      { is_completed: true },
    ];
    expect(calculateEducationProgress(modules)).toEqual({
      completed: 6,
      total: 6,
      percentage: 100,
    });
  });
});
