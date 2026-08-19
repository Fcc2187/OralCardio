import {
  businessDateTimeLocalToIso,
  businessDateTimeLocalValue,
} from "./businessClock";

const DATE_TIME_LOCAL_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

/** "YYYY-MM-DDTHH:mm" de São Paulo -> instante ISO 8601 em UTC. */
export function localDateTimeInputToIso(value: string): string | null {
  const match = DATE_TIME_LOCAL_PATTERN.exec(value);
  if (!match) return null;

  const [, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr] = match;
  const year = Number(yearStr);
  const month = Number(monthStr) - 1;
  const day = Number(dayStr);
  const second = secondStr ? Number(secondStr) : 0;

  const calendarDate = new Date(Date.UTC(year, month, day));
  if (
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() !== month ||
    calendarDate.getUTCDate() !== day ||
    Number(hourStr) > 23 ||
    Number(minuteStr) > 59 ||
    second > 59
  ) {
    return null;
  }

  return businessDateTimeLocalToIso({
    year,
    month: month + 1,
    day,
    hour: Number(hourStr),
    minute: Number(minuteStr),
    second,
  });
}

/** Instante ISO 8601 vindo da API -> "YYYY-MM-DDTHH:mm" em São Paulo. */
export function isoToLocalDateTimeInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return businessDateTimeLocalValue(date);
}

/** Valor para o atributo `min` do input (agora, arredondado ao minuto). */
export function nowAsDateTimeLocalValue(nowMs: number = Date.now()): string {
  return businessDateTimeLocalValue(new Date(nowMs));
}

/** Valor para o atributo `max`: 5 anos à frente. Sem isso, um erro de
 * digitação no ano ("2226") cria uma consulta que fica eternamente no topo
 * da lista ordenada por `scheduled_at` descendente. */
export function maxSchedulingDateTimeLocalValue(nowMs: number = Date.now()): string {
  const date = new Date(nowMs);
  const businessValue = businessDateTimeLocalValue(date);
  const year = Number(businessValue.slice(0, 4)) + 5;
  return `${year}${businessValue.slice(4)}`;
}
