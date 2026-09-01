import { BUSINESS_TIME_ZONE, businessCalendarDayDelta } from "./businessClock";

// Instâncias em escopo de módulo — construir um Intl.DateTimeFormat dentro de
// um .map() sobre uma lista de consultas repetiria o custo a cada render.
const dateTimeLongFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: BUSINESS_TIME_ZONE,
});

const dateLongFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: BUSINESS_TIME_ZONE,
});

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: BUSINESS_TIME_ZONE,
});

// Datas clínicas e de agenda seguem o mesmo calendário de negócio da API.
export function formatDateLong(iso: string): string {
  return dateLongFormatter.format(new Date(iso));
}

export function formatTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

export function formatDateTimeLong(iso: string): string {
  return dateTimeLongFormatter.format(new Date(iso));
}

/** Diferença em dias de calendário (não em blocos de 24h) entre dois
 * instantes. "Hoje 23:00" e "amanhã 01:00" precisam dar 1, não 0 — por isso
 * comparamos meia-noite local, não `(to - from) / 86400000`. */
export function calendarDayDelta(fromMs: number, toMs: number): number {
  return businessCalendarDayDelta(fromMs, toMs);
}

/** Rótulo relativo em pt-BR para um delta de dias de calendário. */
export function relativeDayLabel(delta: number): string {
  if (delta === 0) return "Hoje";
  if (delta === 1) return "Amanhã";
  if (delta === -1) return "Ontem";
  if (delta > 1) return `Em ${delta} dias`;
  return `Há ${Math.abs(delta)} dias`;
}
