import type { NotificationPreferences } from "./types";

function toMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours <= 23 && minutes <= 59 ? hours * 60 + minutes : null;
}

function isQuietTime(value: number, start: number, end: number): boolean {
  return start < end ? value >= start && value < end : value >= start || value < end;
}

/** Espelha as invariantes do backend para evitar erro tardio no paciente. */
export function validateNotificationPreferences(value: NotificationPreferences): string | null {
  const brushingTimes = value.brushing_times.map(toMinutes);
  const flossingTime = toMinutes(value.flossing_time);
  const quietStart = toMinutes(value.quiet_hours_start);
  const quietEnd = toMinutes(value.quiet_hours_end);

  if (brushingTimes.some((time) => time === null) || flossingTime === null || quietStart === null || quietEnd === null) {
    return "Informe horários válidos.";
  }
  const validBrushingTimes = brushingTimes as number[];
  if (new Set(validBrushingTimes).size !== validBrushingTimes.length) {
    return "Os horários de escovação não podem se repetir.";
  }
  if (quietStart === quietEnd) {
    return "O início e o fim do horário silencioso devem ser diferentes.";
  }
  if ([...validBrushingTimes, flossingTime].some((time) => isQuietTime(time, quietStart, quietEnd))) {
    return "Lembretes de hábitos não podem ficar dentro do horário silencioso.";
  }
  const leads = value.appointment_lead_minutes;
  if (leads.length < 1 || leads.length > 3 || new Set(leads).size !== leads.length) {
    return "Configure entre uma e três antecedências de consulta sem repetições.";
  }
  return null;
}
