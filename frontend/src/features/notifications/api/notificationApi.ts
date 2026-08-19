import { httpClient } from "@/shared/api/httpClient";

import type { NotificationPreferences, PushSubscriptionPayload } from "../types";

export function fetchNotificationPreferences(): Promise<NotificationPreferences> {
  return httpClient.get("/api/v1/notifications/preferences");
}

export function updateNotificationPreferences(
  value: NotificationPreferences,
): Promise<NotificationPreferences> {
  return httpClient.put("/api/v1/notifications/preferences", {
    enabled: value.enabled,
    brushing_enabled: value.brushing_enabled,
    brushing_times: value.brushing_times,
    flossing_enabled: value.flossing_enabled,
    flossing_time: value.flossing_time,
    appointments_enabled: value.appointments_enabled,
    appointment_lead_minutes: value.appointment_lead_minutes,
    quiet_hours_start: value.quiet_hours_start,
    quiet_hours_end: value.quiet_hours_end,
  });
}

export function fetchVapidPublicKey(): Promise<{ public_key: string; key_version: number }> {
  return httpClient.get("/api/v1/notifications/vapid-public-key");
}

export function registerPushSubscription(payload: PushSubscriptionPayload): Promise<void> {
  return httpClient.post("/api/v1/notifications/subscriptions", payload);
}

export function unregisterPushSubscription(endpoint: string): Promise<{ unsubscribed: boolean }> {
  return httpClient.delete("/api/v1/notifications/subscriptions/current", { endpoint });
}

export function requestTestNotification(): Promise<{ job_id: string; status: string }> {
  return httpClient.post("/api/v1/notifications/test");
}
