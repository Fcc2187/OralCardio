export const BUSINESS_TIME_ZONE = "America/Sao_Paulo";

interface BusinessDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const PARTS_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function asNumber(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): number {
  const value = parts.find((part) => part.type === type)?.value;
  return value ? Number(value) : Number.NaN;
}

export function businessDateTimeParts(value: Date): BusinessDateTimeParts {
  const parts = PARTS_FORMATTER.formatToParts(value);
  return {
    year: asNumber(parts, "year"),
    month: asNumber(parts, "month"),
    day: asNumber(parts, "day"),
    hour: asNumber(parts, "hour"),
    minute: asNumber(parts, "minute"),
    second: asNumber(parts, "second"),
  };
}

export function businessDateKey(value: Date = new Date()): string {
  const { year, month, day } = businessDateTimeParts(value);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function businessDateTimeLocalValue(value: Date): string {
  const { year, month, day, hour, minute } = businessDateTimeParts(value);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function asUtcMs(parts: BusinessDateTimeParts): number {
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
}

/** Converte uma hora civil de São Paulo em um instante UTC sem depender do fuso do dispositivo. */
export function businessDateTimeLocalToIso(value: BusinessDateTimeParts): string | null {
  const desired = asUtcMs(value);
  let instant = desired;

  // O offset é obtido do próprio Intl. Duas passagens resolvem transições de
  // fuso; a comparação final rejeita datas impossíveis em eventual horário de verão.
  for (let index = 0; index < 3; index += 1) {
    const actual = businessDateTimeParts(new Date(instant));
    const delta = desired - asUtcMs(actual);
    if (delta === 0) return new Date(instant).toISOString();
    instant += delta;
  }
  return null;
}

export function businessCalendarDayDelta(fromMs: number, toMs: number): number {
  const [fromYear, fromMonth, fromDay] = businessDateKey(new Date(fromMs)).split("-").map(Number);
  const [toYear, toMonth, toDay] = businessDateKey(new Date(toMs)).split("-").map(Number);
  const from = Date.UTC(fromYear, fromMonth - 1, fromDay);
  const to = Date.UTC(toYear, toMonth - 1, toDay);
  return Math.round((to - from) / 86_400_000);
}
