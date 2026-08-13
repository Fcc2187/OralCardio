import { httpClient } from "@/shared/api/httpClient";
import type { Page } from "@/shared/types/common";
import type { WithUnlockedAchievements } from "@/shared/types/gamification";

import type { Appointment, AppointmentInput, AppointmentPatch } from "../types";

export function createAppointment(
  input: AppointmentInput,
): Promise<WithUnlockedAchievements<Appointment>> {
  return httpClient.post<WithUnlockedAchievements<Appointment>>("/api/v1/appointments", input);
}

export function listAppointments(params: {
  limit: number;
  offset: number;
}): Promise<Page<Appointment>> {
  const query = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  });
  return httpClient.get<Page<Appointment>>(`/api/v1/appointments?${query.toString()}`);
}

export function fetchAppointment(id: string): Promise<Appointment> {
  return httpClient.get<Appointment>(`/api/v1/appointments/${id}`);
}

// Bare Appointment — sem envelope: PATCH não reavalia conquistas.
export function patchAppointment(id: string, patch: AppointmentPatch): Promise<Appointment> {
  return httpClient.patch<Appointment>(`/api/v1/appointments/${id}`, patch);
}
