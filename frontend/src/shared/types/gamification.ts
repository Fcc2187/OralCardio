export interface UnlockedAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points_reward: number;
}

/** Espelha `WithUnlockedAchievements[T]` do backend (schemas/gamification.py). */
export interface WithUnlockedAchievements<T> {
  data: T;
  unlocked_achievements: UnlockedAchievement[];
}

export interface AchievementStatus {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition_type: string;
  condition_value: number;
  points_reward: number;
  unlocked: boolean;
  earned_at: string | null;
}

export interface UserStats {
  total_points: number;
  level: number;
  level_name: string;
  current_streak_days: number;
  longest_streak_days: number;
  total_brushings: number;
  total_flossings: number;
  last_brushing_date: string | null;
  last_flossing_date: string | null;
}
