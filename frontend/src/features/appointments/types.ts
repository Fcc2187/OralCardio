export type AppointmentType = "routine_checkup" | "cleaning" | "emergency" | "follow_up" | "procedure";

export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "rescheduled";

export interface Appointment {
  id: string;
  user_id: string;
  scheduled_at: string;
  appointment_type: AppointmentType;
  dentist_name: string;
  clinic_name: string | null;
  clinic_address: string | null;
  clinic_phone: string | null;
  notes: string | null;
  status: AppointmentStatus;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppointmentInput {
  scheduled_at: string;
  appointment_type: AppointmentType;
  dentist_name: string;
  clinic_name?: string | null;
  clinic_address?: string | null;
  clinic_phone?: string | null;
  notes?: string | null;
}

/** Opcionais aqui são `string`, nunca `null`: o backend filtra `null` do
 * PATCH antes de gravar (não há como anular um campo assim), então limpar
 * um opcional só funciona enviando `""`. Ver buildAppointmentPatch.ts. */
export interface AppointmentPatch {
  scheduled_at?: string;
  appointment_type?: AppointmentType;
  dentist_name?: string;
  clinic_name?: string;
  clinic_address?: string;
  clinic_phone?: string;
  notes?: string;
  status?: AppointmentStatus;
}
