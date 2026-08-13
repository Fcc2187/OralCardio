export type BrushingZone = "upper_right" | "upper_left" | "lower_right" | "lower_left" | "tongue";

export interface BrushingSession {
  id: string;
  user_id: string;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  target_duration: number;
  zones_completed: BrushingZone[];
  is_completed: boolean;
  technique_tip_shown: string | null;
  notes: string | null;
}
