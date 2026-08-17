/** Fonte única de chaves de query. Vivem em `shared/` — não em cada feature —
 * porque são um contrato transversal: `invalidateGamifiedQueries` precisa da
 * chave do dashboard sem que `shared/` importe de `features/` (isso seria
 * inversão de dependência). */
export const dashboardQueryKey = ["dashboard"] as const;

export const gamificationStatsQueryKey = ["gamification", "stats"] as const;
export const gamificationAchievementsQueryKey = ["gamification", "achievements"] as const;

export const healthProfileQueryKey = ["health-profile"] as const;

export const userProfileQueryKey = ["user-profile"] as const;

export const educationModulesQueryKey = ["education", "modules"] as const;
export const educationModuleQueryKey = (slug: string) => ["education", "modules", slug] as const;

export const appointmentsListQueryKey = ["appointments", "list"] as const;
export const appointmentQueryKey = (id: string) => ["appointments", "detail", id] as const;

export const achievementRevealsQueryKey = (userId?: string) =>
  ["gamification", "achievement-reveals", userId] as const;
