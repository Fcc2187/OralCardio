import { describe, expect, it } from "vitest";

import { computeReadTimeSeconds } from "./computeReadTimeSeconds";

describe("computeReadTimeSeconds", () => {
  it("calcula segundos inteiros decorridos", () => {
    const startedAtMs = 1_000_000;
    const nowMs = startedAtMs + 45_000;

    expect(computeReadTimeSeconds(startedAtMs, nowMs)).toBe(45);
  });

  it("arredonda para baixo frações de segundo", () => {
    const startedAtMs = 1_000_000;
    const nowMs = startedAtMs + 45_999;

    expect(computeReadTimeSeconds(startedAtMs, nowMs)).toBe(45);
  });

  it("nunca retorna negativo, mesmo se o relógio do sistema retroceder", () => {
    const startedAtMs = 1_000_000;
    const nowMs = startedAtMs - 10_000;

    expect(computeReadTimeSeconds(startedAtMs, nowMs)).toBe(0);
  });

  it("tem teto de 3600s (uma aba esquecida aberta não pode inflar a métrica)", () => {
    const startedAtMs = 0;
    const nowMs = 10 * 3600 * 1000; // 10 horas depois

    expect(computeReadTimeSeconds(startedAtMs, nowMs)).toBe(3600);
  });
});
