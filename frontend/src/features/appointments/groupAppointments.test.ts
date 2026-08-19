import { describe, expect, it } from "vitest";

import { groupAppointments } from "./groupAppointments";
import type { Appointment, AppointmentStatus } from "./types";

const NOW_MS = new Date(2026, 5, 15, 12, 0).getTime();

let nextId = 0;
function makeAppointment(scheduledAt: string, status: AppointmentStatus): Appointment {
  nextId += 1;
  return {
    id: `apt-${nextId}`,
    user_id: "user-1",
    scheduled_at: scheduledAt,
    appointment_type: "routine_checkup",
    dentist_name: "Dra. Ana",
    clinic_name: null,
    clinic_address: null,
    clinic_phone: null,
    notes: null,
    status,
    created_at: scheduledAt,
    updated_at: scheduledAt,
  };
}

describe("groupAppointments", () => {
  it("agrupa consulta scheduled com data futura em upcoming", () => {
    const appointment = makeAppointment("2026-06-20T12:00:00Z", "scheduled");

    const groups = groupAppointments([appointment], NOW_MS);

    expect(groups.upcoming).toEqual([appointment]);
    expect(groups.overdue).toEqual([]);
    expect(groups.past).toEqual([]);
  });

  it("agrupa consulta scheduled com data passada em overdue (o estado mais comum na prática)", () => {
    const appointment = makeAppointment("2026-06-10T12:00:00Z", "scheduled");

    const groups = groupAppointments([appointment], NOW_MS);

    expect(groups.overdue).toEqual([appointment]);
    expect(groups.upcoming).toEqual([]);
    expect(groups.past).toEqual([]);
  });

  it("agrupa consulta completed/cancelled em past, independente da data", () => {
    const completedFuture = makeAppointment("2026-06-20T12:00:00Z", "completed");
    const cancelledPast = makeAppointment("2026-06-10T12:00:00Z", "cancelled");

    const groups = groupAppointments([completedFuture, cancelledPast], NOW_MS);

    expect(groups.past).toEqual([completedFuture, cancelledPast]);
  });

  it("trata o instante exatamente igual a now como não-futuro", () => {
    const appointment = makeAppointment(new Date(NOW_MS).toISOString(), "scheduled");

    const groups = groupAppointments([appointment], NOW_MS);

    expect(groups.overdue).toEqual([appointment]);
    expect(groups.upcoming).toEqual([]);
  });

  it("ordena 'upcoming' de forma ascendente (mais próxima primeiro) mesmo recebendo em DESC", () => {
    const far = makeAppointment("2026-08-01T12:00:00Z", "scheduled");
    const soon = makeAppointment("2026-06-16T12:00:00Z", "scheduled");
    const middle = makeAppointment("2026-07-01T12:00:00Z", "scheduled");

    // A API devolve tudo em scheduled_at DESC — simulado aqui na ordem de entrada.
    const groups = groupAppointments([far, middle, soon], NOW_MS);

    expect(groups.upcoming).toEqual([soon, middle, far]);
  });

  it("ordena 'past' de forma descendente (mais recente primeiro)", () => {
    const older = makeAppointment("2026-01-01T12:00:00Z", "completed");
    const newer = makeAppointment("2026-05-01T12:00:00Z", "completed");

    const groups = groupAppointments([older, newer], NOW_MS);

    expect(groups.past).toEqual([newer, older]);
  });

  it("ordena 'overdue' de forma descendente (mais recente primeiro)", () => {
    const older = makeAppointment("2026-01-01T12:00:00Z", "scheduled");
    const newer = makeAppointment("2026-05-01T12:00:00Z", "scheduled");

    const groups = groupAppointments([older, newer], NOW_MS);

    expect(groups.overdue).toEqual([newer, older]);
  });

  it("agrupa rescheduled com data futura em upcoming", () => {
    const appointment = makeAppointment("2026-06-20T12:00:00Z", "rescheduled");

    const groups = groupAppointments([appointment], NOW_MS);

    expect(groups.upcoming).toEqual([appointment]);
  });
});
