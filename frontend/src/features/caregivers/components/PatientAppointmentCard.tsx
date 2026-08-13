import { AppointmentSummary } from "@/features/appointments/components/AppointmentSummary";
import type { Appointment } from "@/features/appointments/types";

interface PatientAppointmentCardProps {
  appointment: Appointment;
}

// Sem `<Link>`: o painel do cuidador é somente leitura, e navegar para
// `/agenda/:id` seria a rota de detalhe do próprio CUIDADOR com o id de
// outra pessoa (ver Fase B — é por isso que `AppointmentSummary` existe).
export function PatientAppointmentCard({ appointment }: PatientAppointmentCardProps) {
  return (
    <div className="flex flex-col gap-xs rounded-lg border border-hairline bg-canvas p-md">
      <AppointmentSummary appointment={appointment} />
    </div>
  );
}
