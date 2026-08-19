import { describe, expect, it } from "vitest";

import type { NotificationPreferences } from "./types";
import { validateNotificationPreferences } from "./validateNotificationPreferences";

const VALID: NotificationPreferences = {
  enabled: true,
  brushing_enabled: true,
  brushing_times: ["08:00", "20:00"],
  flossing_enabled: true,
  flossing_time: "12:00",
  appointments_enabled: true,
  appointment_lead_minutes: [1440],
  quiet_hours_start: "22:00",
  quiet_hours_end: "07:00",
  consented_at: null,
};

describe("validateNotificationPreferences", () => {
  it("accepts a valid schedule", () => {
    expect(validateNotificationPreferences(VALID)).toBeNull();
  });

  it("rejects duplicated brushing times and invalid lead counts", () => {
    expect(validateNotificationPreferences({ ...VALID, brushing_times: ["08:00", "08:00"] }))
      .toContain("não podem se repetir");
    expect(validateNotificationPreferences({ ...VALID, appointment_lead_minutes: [] }))
      .toContain("entre uma e três");
  });

  it("rejects a habit reminder inside quiet hours", () => {
    expect(validateNotificationPreferences({ ...VALID, flossing_time: "23:00" }))
      .toContain("horário silencioso");
  });
});
