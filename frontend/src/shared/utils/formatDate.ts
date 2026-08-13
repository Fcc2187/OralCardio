// Instâncias em escopo de módulo — construir um Intl.DateTimeFormat dentro de
// um .map() sobre uma lista de consultas repetiria o custo a cada render.
const dateTimeLongFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const dateShortFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const timeFormatter = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

// Locale fixo em "pt-BR" (nunca `undefined`): um dispositivo configurado em
// en-US não pode renderizar "9/15/2026" para um paciente brasileiro. Sem
// `timeZone` explícito de propósito — segue o fuso do dispositivo, coerente
// com o que `dateTimeLocal.ts` já assume para o input local.
export function formatDateTimeLong(iso: string): string {
  return dateTimeLongFormatter.format(new Date(iso));
}

export function formatDateShort(iso: string): string {
  return dateShortFormatter.format(new Date(iso));
}

export function formatTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

/** Diferença em dias de calendário (não em blocos de 24h) entre dois
 * instantes. "Hoje 23:00" e "amanhã 01:00" precisam dar 1, não 0 — por isso
 * comparamos meia-noite local, não `(to - from) / 86400000`. */
export function calendarDayDelta(fromMs: number, toMs: number): number {
  const from = new Date(fromMs);
  const to = new Date(toMs);
  const fromMidnight = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const toMidnight = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.round((toMidnight - fromMidnight) / 86_400_000);
}

/** Rótulo relativo em pt-BR para um delta de dias de calendário. */
export function relativeDayLabel(delta: number): string {
  if (delta === 0) return "Hoje";
  if (delta === 1) return "Amanhã";
  if (delta === -1) return "Ontem";
  if (delta > 1) return `Em ${delta} dias`;
  return `Há ${Math.abs(delta)} dias`;
}
