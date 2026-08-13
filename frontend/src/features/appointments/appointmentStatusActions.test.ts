import { describe, expect, it } from "vitest";

import { availableStatusActions, canEdit, isTerminal } from "./appointmentStatusActions";

// Teste de contrato: espelha linha a linha
// backend/app/domain/appointments.py::_ALLOWED_TRANSITIONS
//   scheduled   -> completed | cancelled | rescheduled
//   rescheduled -> scheduled
//   completed   -> (terminal)
//   cancelled   -> (terminal)
describe("availableStatusActions", () => {
  it("scheduled pode ir para completed, cancelled ou rescheduled", () => {
    const targets = availableStatusActions("scheduled").map((action) => action.status);
    expect(targets.sort()).toEqual(["cancelled", "completed", "rescheduled"]);
  });

  it("rescheduled só pode voltar para scheduled", () => {
    const targets = availableStatusActions("rescheduled").map((action) => action.status);
    expect(targets).toEqual(["scheduled"]);
  });

  it("completed é terminal — nenhuma ação disponível", () => {
    expect(availableStatusActions("completed")).toEqual([]);
  });

  it("cancelled é terminal — nenhuma ação disponível", () => {
    expect(availableStatusActions("cancelled")).toEqual([]);
  });
});

describe("isTerminal / canEdit", () => {
  it("completed e cancelled são terminais e não editáveis", () => {
    expect(isTerminal("completed")).toBe(true);
    expect(isTerminal("cancelled")).toBe(true);
    expect(canEdit("completed")).toBe(false);
    expect(canEdit("cancelled")).toBe(false);
  });

  it("scheduled e rescheduled não são terminais e são editáveis", () => {
    expect(isTerminal("scheduled")).toBe(false);
    expect(isTerminal("rescheduled")).toBe(false);
    expect(canEdit("scheduled")).toBe(true);
    expect(canEdit("rescheduled")).toBe(true);
  });
});
