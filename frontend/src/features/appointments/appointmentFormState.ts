import { isoToLocalDateTimeInput } from "@/shared/utils/dateTimeLocal";

import type { Appointment, AppointmentType } from "./types";

export interface AppointmentFormState {
  scheduledAtLocal: string;
  appointmentType: AppointmentType | "";
  dentistName: string;
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  notes: string;
}

export const INITIAL_APPOINTMENT_FORM_STATE: AppointmentFormState = {
  scheduledAtLocal: "",
  appointmentType: "",
  dentistName: "",
  clinicName: "",
  clinicAddress: "",
  clinicPhone: "",
  notes: "",
};

export function appointmentToFormState(appointment: Appointment): AppointmentFormState {
  return {
    scheduledAtLocal: isoToLocalDateTimeInput(appointment.scheduled_at),
    appointmentType: appointment.appointment_type,
    dentistName: appointment.dentist_name,
    clinicName: appointment.clinic_name ?? "",
    clinicAddress: appointment.clinic_address ?? "",
    clinicPhone: appointment.clinic_phone ?? "",
    notes: appointment.notes ?? "",
  };
}
