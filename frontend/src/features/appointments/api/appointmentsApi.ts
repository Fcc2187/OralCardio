import { httpClient, type HttpRequestOptions } from "@/shared/api/httpClient";
import type { CursorPage } from "@/shared/types/common";

import type { Appointment, AppointmentInput, AppointmentPatch } from "../types";

export function createAppointment(
  input: AppointmentInput,
  options?: HttpRequestOptions,
): Promise<Appointment> {
  return httpClient.post<Appointment>("/api/v1/appointments", input, options);
}

export function listAppointments(params: {
  limit: number;
  cursor?: string | null;
}): Promise<CursorPage<Appointment>> {
  const query = new URLSearchParams({ limit: String(params.limit) });
  if (params.cursor) query.set("cursor", params.cursor);
  return httpClient.get<CursorPage<Appointment>>(`/api/v1/appointments?${query.toString()}`);
}

export function fetchAppointment(id: string): Promise<Appointment> {
  return httpClient.get<Appointment>(`/api/v1/appointments/${id}`);
}

// Bare Appointment — sem envelope: PATCH não reavalia conquistas.
export function patchAppointment(id: string, patch: AppointmentPatch): Promise<Appointment> {
  return httpClient.patch<Appointment>(`/api/v1/appointments/${id}`, patch);
}
