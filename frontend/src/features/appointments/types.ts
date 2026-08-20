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

/** Um campo opcional presente com `null` limpa seu valor; ausente não o altera. */
export interface AppointmentPatch {
  scheduled_at?: string;
  appointment_type?: AppointmentType;
  dentist_name?: string;
  clinic_name?: string | null;
  clinic_address?: string | null;
  clinic_phone?: string | null;
  notes?: string | null;
  status?: AppointmentStatus;
}
