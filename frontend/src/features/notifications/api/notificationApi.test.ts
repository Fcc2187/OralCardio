import { beforeEach, describe, expect, it, vi } from "vitest";

import { httpClient } from "@/shared/api/httpClient";

import { updateNotificationPreferences } from "./notificationApi";

vi.mock("@/shared/api/httpClient", () => ({
  httpClient: { put: vi.fn() },
}));

describe("notificationApi", () => {
  beforeEach(() => vi.mocked(httpClient.put).mockReset());

  it("não reenvia o timestamp de consentimento controlado pelo servidor", async () => {
    vi.mocked(httpClient.put).mockResolvedValue({});
    await updateNotificationPreferences({
      enabled: true,
      brushing_enabled: true,
      brushing_times: ["08:00", "20:00"],
      flossing_enabled: true,
      flossing_time: "21:00",
      appointments_enabled: true,
      appointment_lead_minutes: [1440, 120],
      quiet_hours_start: "22:00",
      quiet_hours_end: "07:00",
      consented_at: "2026-08-19T12:00:00Z",
    });

    expect(httpClient.put).toHaveBeenCalledWith(
      "/api/v1/notifications/preferences",
      expect.not.objectContaining({ consented_at: expect.anything() }),
    );
  });
});

