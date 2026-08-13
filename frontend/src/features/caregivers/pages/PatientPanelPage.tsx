import { useMemo } from "react";
import { useParams } from "react-router-dom";

import { Button } from "@/shared/components/ui/Button";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { ErrorFeedback, LoadingFeedback } from "@/shared/components/ui/Feedback";
import { Screen } from "@/shared/components/layout/Screen";

import {
  useMyPatientsQuery,
  usePatientAppointmentsInfiniteQuery,
  usePatientBrushingSessionsInfiniteQuery,
  usePatientStatsQuery,
} from "../api/useCaregiverQueries";
import { PatientAppointmentCard } from "../components/PatientAppointmentCard";
import { PatientBrushingList } from "../components/PatientBrushingList";
import { PatientStatsPanel } from "../components/PatientStatsPanel";
import { findPatientLink, patientDisplayName } from "../findPatientLink";

export function PatientPanelPage() {
  const { patientId = "" } = useParams<{ patientId: string }>();
  const patientsQuery = useMyPatientsQuery();

  // Não existe GET /caregiver/patients/{id} — resolve o vínculo a partir da
  // lista (normalmente já em cache, vinda de /acompanhando).
  const link = patientsQuery.data ? findPatientLink(patientsQuery.data, patientId) : undefined;
  const canViewReports = link?.can_view_reports ?? false;
  const canViewAppointments = link?.can_view_appointments ?? false;

  const statsQuery = usePatientStatsQuery(patientId, canViewReports);
  const brushingQuery = usePatientBrushingSessionsInfiniteQuery(patientId, canViewReports);
  const appointmentsQuery = usePatientAppointmentsInfiniteQuery(patientId, canViewAppointments);

  const brushingSessions = useMemo(
    () => brushingQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [brushingQuery.data],
  );
  const appointments = useMemo(
    () => appointmentsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [appointmentsQuery.data],
  );

  if (patientsQuery.isPending) {
    return <LoadingFeedback message="Carregando…" />;
  }

  if (patientsQuery.isError) {
    return (
      <Screen title="Acompanhando" backTo="/acompanhando" backLabel="Acompanhando">
        <ErrorFeedback message="Não foi possível carregar seus pacientes. Tente novamente em instantes." />
      </Screen>
    );
  }

  if (!link) {
    // Não é uma tela de 404: a causa provável é revogação no meio da
    // sessão, não um id inválido.
    return (
      <Screen title="Acompanhando" backTo="/acompanhando" backLabel="Acompanhando">
        <EmptyState
          title="Sem acesso"
          message="Você não tem mais acesso aos dados desta pessoa."
        />
      </Screen>
    );
  }

  const sharesNothing = !canViewReports && !canViewAppointments;

  return (
    <Screen title={patientDisplayName(link)} backTo="/acompanhando" backLabel="Acompanhando">
      {sharesNothing ? (
        <EmptyState
          title={patientDisplayName(link)}
          message="Esta pessoa não está compartilhando nenhum dado com você no momento."
        />
      ) : (
        <>
          {canViewReports ? (
            <section className="flex flex-col gap-md">
              {statsQuery.isPending ? (
                <LoadingFeedback message="Carregando estatísticas…" />
              ) : statsQuery.isError ? (
                <ErrorFeedback message="Não foi possível carregar as estatísticas." />
              ) : (
                <PatientStatsPanel stats={statsQuery.data} />
              )}

              <h2 className="font-display text-title-lg">Escovações recentes</h2>
              {brushingQuery.isPending ? (
                <LoadingFeedback message="Carregando escovações…" />
              ) : brushingQuery.isError ? (
                <ErrorFeedback message="Não foi possível carregar as escovações." />
              ) : (
                <PatientBrushingList sessions={brushingSessions} />
              )}
              {brushingQuery.hasNextPage ? (
                <Button
                  variant="secondary"
                  onClick={() => brushingQuery.fetchNextPage()}
                  disabled={brushingQuery.isFetchingNextPage}
                >
                  {brushingQuery.isFetchingNextPage ? "Carregando…" : "Carregar mais"}
                </Button>
              ) : null}
            </section>
          ) : null}

          {canViewAppointments ? (
            <section className="flex flex-col gap-md">
              <h2 className="font-display text-title-lg">Consultas</h2>
              {appointmentsQuery.isPending ? (
                <LoadingFeedback message="Carregando consultas…" />
              ) : appointmentsQuery.isError ? (
                <ErrorFeedback message="Não foi possível carregar as consultas." />
              ) : appointments.length === 0 ? (
                <p className="font-body text-body-sm text-muted">Nenhuma consulta agendada.</p>
              ) : (
                appointments.map((appointment) => (
                  <PatientAppointmentCard key={appointment.id} appointment={appointment} />
                ))
              )}
              {appointmentsQuery.hasNextPage ? (
                <Button
                  variant="secondary"
                  onClick={() => appointmentsQuery.fetchNextPage()}
                  disabled={appointmentsQuery.isFetchingNextPage}
                >
                  {appointmentsQuery.isFetchingNextPage ? "Carregando…" : "Carregar mais"}
                </Button>
              ) : null}
            </section>
          ) : null}
        </>
      )}
    </Screen>
  );
}
