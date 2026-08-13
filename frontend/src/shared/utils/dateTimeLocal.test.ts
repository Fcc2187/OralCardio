import { describe, expect, it } from "vitest";

import {
  isoToLocalDateTimeInput,
  localDateTimeInputToIso,
  maxSchedulingDateTimeLocalValue,
  nowAsDateTimeLocalValue,
} from "./dateTimeLocal";

// Estes testes só valem alguma coisa se TZ != UTC — ver vite.config.ts
// (test.env.TZ = "America/Sao_Paulo"). Em UTC, uma implementação errada com
// `toISOString().slice(0, 16)` passaria em todas as asserções sem revelar
// o bug de fuso.
describe("localDateTimeInputToIso", () => {
  it("converte um horário local (São Paulo, UTC-3) para o instante ISO em UTC com offset explícito", () => {
    expect(localDateTimeInputToIso("2026-09-15T14:30")).toBe("2026-09-15T17:30:00.000Z");
  });

  it("aceita segundos opcionais", () => {
    expect(localDateTimeInputToIso("2026-09-15T14:30:45")).toBe("2026-09-15T17:30:45.000Z");
  });

  it("rejeita entrada malformada", () => {
    expect(localDateTimeInputToIso("não é uma data")).toBeNull();
    expect(localDateTimeInputToIso("2026-09-15")).toBeNull();
    expect(localDateTimeInputToIso("2026/09/15T14:30")).toBeNull();
    expect(localDateTimeInputToIso("")).toBeNull();
  });

  it("rejeita estouro de calendário em vez de normalizar silenciosamente", () => {
    // 31 de fevereiro não existe; o construtor de Date normalizaria para
    // 3 de março, e é exatamente essa normalização silenciosa que a função
    // precisa recusar.
    expect(localDateTimeInputToIso("2026-02-31T10:00")).toBeNull();
  });

  it("rejeita ano de dois dígitos (Date mapeia 0-99 para 19xx)", () => {
    expect(localDateTimeInputToIso("0026-09-15T14:30")).toBeNull();
  });
});

describe("isoToLocalDateTimeInput", () => {
  it("converte um instante ISO em UTC para o horário local (São Paulo, UTC-3)", () => {
    expect(isoToLocalDateTimeInput("2026-09-15T17:30:00.000Z")).toBe("2026-09-15T14:30");
  });

  it("devolve string vazia para ISO inválido", () => {
    expect(isoToLocalDateTimeInput("não é uma data")).toBe("");
  });
});

describe("round-trip local -> ISO -> local", () => {
  it("preserva o horário digitado (perde apenas segundos, que o input não coleta)", () => {
    const original = "2026-09-15T14:30";
    const iso = localDateTimeInputToIso(original);
    expect(iso).not.toBeNull();
    expect(isoToLocalDateTimeInput(iso as string)).toBe(original);
  });
});

describe("nowAsDateTimeLocalValue / maxSchedulingDateTimeLocalValue", () => {
  it("max fica exatamente 5 anos à frente de now", () => {
    const nowMs = new Date(2026, 5, 15, 10, 0).getTime();
    const now = nowAsDateTimeLocalValue(nowMs);
    const max = maxSchedulingDateTimeLocalValue(nowMs);

    expect(now).toBe("2026-06-15T10:00");
    expect(max).toBe("2031-06-15T10:00");
  });
});
