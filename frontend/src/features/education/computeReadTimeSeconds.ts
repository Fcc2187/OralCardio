const MAX_READ_TIME_SECONDS = 3600;

/** Segundos decorridos entre o início da leitura e agora: sempre inteiro,
 * nunca negativo (o relógio do sistema pode retroceder) e nunca acima de 1h.
 * O backend só valida `>= 0` — uma aba esquecida aberta no fim de semana
 * enviaria dezenas de milhares de segundos e envenenaria a métrica sem este
 * teto. */
export function computeReadTimeSeconds(startedAtMs: number, nowMs: number): number {
  const elapsedSeconds = Math.floor((nowMs - startedAtMs) / 1000);
  return Math.min(Math.max(elapsedSeconds, 0), MAX_READ_TIME_SECONDS);
}
