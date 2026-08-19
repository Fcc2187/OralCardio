export interface NotificationPreferences {
  enabled: boolean;
  brushing_enabled: boolean;
  brushing_times: string[];
  flossing_enabled: boolean;
  flossing_time: string;
  appointments_enabled: boolean;
  appointment_lead_minutes: number[];
  quiet_hours_start: string;
  quiet_hours_end: string;
  consented_at: string | null;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  expiration_time: string | null;
  device_label: string;
}

export type PushPermissionState = NotificationPermission | "unsupported" | "install-required";

