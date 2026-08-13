import { describe, expect, it } from "vitest";

import { calendarDayDelta, relativeDayLabel } from "./formatDate";

// Nunca testar a saída do Intl aqui: o build de ICU do Node varia, e o
// pt-BR emite espaços especiais (U+202F/U+00A0) em vez de espaço comum —
// uma asserção de string formatada quebraria em CI por motivo alheio ao
// código.
describe("calendarDayDelta", () => {
  it("dá 0 para o mesmo dia de calendário, mesmo com horas diferentes", () => {
    const morning = new Date(2026, 5, 15, 8, 0).getTime();
    const night = new Date(2026, 5, 15, 23, 0).getTime();
    expect(calendarDayDelta(morning, night)).toBe(0);
  });

  it("dá 1 para 'hoje 23:00' comparado com 'amanhã 01:00' (não um bloco de 24h)", () => {
    const todayLate = new Date(2026, 5, 15, 23, 0).getTime();
    const tomorrowEarly = new Date(2026, 5, 16, 1, 0).getTime();
    expect(calendarDayDelta(todayLate, tomorrowEarly)).toBe(1);
  });

  it("dá negativo quando o segundo instante é anterior ao primeiro", () => {
    const today = new Date(2026, 5, 15, 12, 0).getTime();
    const yesterday = new Date(2026, 5, 14, 12, 0).getTime();
    expect(calendarDayDelta(today, yesterday)).toBe(-1);
  });

  it("conta corretamente através de vários dias", () => {
    const today = new Date(2026, 5, 15).getTime();
    const inFiveDays = new Date(2026, 5, 20).getTime();
    expect(calendarDayDelta(today, inFiveDays)).toBe(5);
  });
});

describe("relativeDayLabel", () => {
  it("rotula os casos próximos em pt-BR", () => {
    expect(relativeDayLabel(0)).toBe("Hoje");
    expect(relativeDayLabel(1)).toBe("Amanhã");
    expect(relativeDayLabel(-1)).toBe("Ontem");
  });

  it("rotula deltas maiores relativamente", () => {
    expect(relativeDayLabel(3)).toBe("Em 3 dias");
    expect(relativeDayLabel(-4)).toBe("Há 4 dias");
  });
});
