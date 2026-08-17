export interface AchievementReveal {
  id: string;
  name: string;
  description: string;
  icon: string;
  points_reward: number;
}

export interface AchievementStatus extends AchievementReveal {
  condition_type: string;
  condition_value: number;
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
