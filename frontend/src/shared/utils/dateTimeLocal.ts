const DATE_TIME_LOCAL_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

/** "YYYY-MM-DDTHH:mm" (relógio local do dispositivo) -> instante ISO 8601 em
 * UTC. Não usamos `new Date(value)` porque a interpretação de uma string sem
 * fuso depende da forma exata da string na spec do ECMAScript (date-only é
 * UTC, date-time é local). O construtor de componentes é local por
 * definição — sem ambiguidade. O `.toISOString()` garante que o backend
 * receba um offset explícito: sem ele, o Postgres interpreta o naive
 * timestamp como UTC e uma consulta "às 14:30" vira 11:30 para um paciente
 * em Brasília. */
export function localDateTimeInputToIso(value: string): string | null {
  const match = DATE_TIME_LOCAL_PATTERN.exec(value);
  if (!match) return null;

  const [, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr] = match;
  const year = Number(yearStr);
  const month = Number(monthStr) - 1;
  const day = Number(dayStr);
  const second = secondStr ? Number(secondStr) : 0;

  const date = new Date(year, month, day, Number(hourStr), Number(minuteStr), second, 0);

  // O construtor normaliza estouros ("2026-02-31" vira 3 de março) e mapeia
  // anos < 100 para 19xx. Reler os componentes rejeita ambos os casos.
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }

  return date.toISOString();
}

/** Instante ISO 8601 vindo da API -> "YYYY-MM-DDTHH:mm" no fuso do
 * dispositivo. NUNCA usar `iso.slice(0, 16)` nem
 * `new Date(iso).toISOString().slice(0, 16)`: ambos devolvem o horário em
 * UTC, e o input trata o valor como local. Editar uma consulta e salvar sem
 * tocar na data deslocaria o horário pelo offset do usuário a cada edição. */
export function isoToLocalDateTimeInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

/** Valor para o atributo `min` do input (agora, arredondado ao minuto). */
export function nowAsDateTimeLocalValue(nowMs: number = Date.now()): string {
  return isoToLocalDateTimeInput(new Date(nowMs).toISOString());
}

/** Valor para o atributo `max`: 5 anos à frente. Sem isso, um erro de
 * digitação no ano ("2226") cria uma consulta que fica eternamente no topo
 * da lista ordenada por `scheduled_at` descendente. */
export function maxSchedulingDateTimeLocalValue(nowMs: number = Date.now()): string {
  const date = new Date(nowMs);
  date.setFullYear(date.getFullYear() + 5);
  return isoToLocalDateTimeInput(date.toISOString());
}
