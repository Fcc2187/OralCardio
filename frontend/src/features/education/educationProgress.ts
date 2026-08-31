import type { EducationModule } from "./types";

export interface EducationProgress {
  completed: number;
  total: number;
  percentage: number;
}
export function calculateEducationProgress(
  modules: readonly Pick<EducationModule, "is_completed">[],
): EducationProgress {
  const total = modules.length;
  if (total === 0) {
    return {
      completed: 0,
      total: 0,
      percentage: 0,
    };
  }

  const completed = modules.filter((m) => m.is_completed).length;
  const percentage = Math.round((completed / total) * 100);

  return {
    completed,
    total,
    percentage,
  };
}
