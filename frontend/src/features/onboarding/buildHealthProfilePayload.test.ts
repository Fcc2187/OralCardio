import { describe, expect, it } from "vitest";

import { buildHealthProfilePayload, INITIAL_QUESTIONNAIRE_STATE } from "./buildHealthProfilePayload";

describe("buildHealthProfilePayload", () => {
  it("throws when no cardiac condition was selected", () => {
    expect(() => buildHealthProfilePayload(INITIAL_QUESTIONNAIRE_STATE)).toThrow(
      "Selecione a condição cardíaca",
    );
  });

  it("splits comma-separated medications and allergies into trimmed arrays", () => {
    const payload = buildHealthProfilePayload({
      ...INITIAL_QUESTIONNAIRE_STATE,
      cardiacCondition: "arrhythmia",
      medicationsText: " Losartana ,  Sinvastatina,Amiodarona ",
      allergiesText: "Penicilina",
    });

    expect(payload.medications).toEqual(["Losartana", "Sinvastatina", "Amiodarona"]);
    expect(payload.allergies).toEqual(["Penicilina"]);
  });

  it("converts blank optional fields to null instead of empty strings", () => {
    const payload = buildHealthProfilePayload({
      ...INITIAL_QUESTIONNAIRE_STATE,
      cardiacCondition: "heart_failure",
    });

    expect(payload.cardiac_condition_detail).toBeNull();
    expect(payload.last_dental_visit).toBeNull();
    expect(payload.brushing_frequency_before).toBeNull();
    expect(payload.dentist_name).toBeNull();
    expect(payload.medications).toEqual([]);
  });

  it("carries booleans, dates and the parsed brushing frequency through unchanged", () => {
    const payload = buildHealthProfilePayload({
      ...INITIAL_QUESTIONNAIRE_STATE,
      cardiacCondition: "valve_disease",
      hasPacemaker: true,
      hasProstheticValve: true,
      lastDentalVisit: "2025-03-10",
      brushingFrequencyBefore: "2",
    });

    expect(payload.has_pacemaker).toBe(true);
    expect(payload.has_prosthetic_valve).toBe(true);
    expect(payload.last_dental_visit).toBe("2025-03-10");
    expect(payload.brushing_frequency_before).toBe(2);
  });
});
