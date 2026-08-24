import { useMemo } from "react";

import { Button } from "@/shared/components/ui/Button";
import { ErrorFeedback, LoadingFeedback } from "@/shared/components/ui/Feedback";
import { LinkButton } from "@/shared/components/ui/LinkButton";
import { Screen } from "@/shared/components/layout/Screen";
import { useCurrentTime } from "@/shared/hooks/useCurrentTime";

import { useAppointmentsInfiniteQuery } from "../api/useAppointmentQueries";
import { AppointmentCard } from "../components/AppointmentCard";
import { groupAppointments } from "../groupAppointments";
import type { Appointment } from "../types";

export function AppointmentsListPage() {
  const query = useAppointmentsInfiniteQuery();
  const now = useCurrentTime();

  const allItems = useMemo(
    () => {
      const uniqueItems = new Map<string, Appointment>();
      for (const page of query.data?.pages ?? []) {
        for (const item of page.items) uniqueItems.set(item.id, item);
      }
      return [...uniqueItems.values()];
    },
    [query.data],
  );
  const groups = useMemo(() => groupAppointments(allItems, now), [allItems, now]);

  if (query.isPending) {
    return <LoadingFeedback message="Carregando sua agenda…" />;
  }

  if (query.isError) {
    return (
      <Screen title="Agenda">
        <ErrorFeedback message="Não foi possível carregar sua agenda. Tente novamente em instantes." />
      </Screen>
    );
  }

  const isEmpty = allItems.length === 0;

  return (
    <Screen title="Agenda">
      <LinkButton to="/agenda/nova">Nova consulta</LinkButton>

      {isEmpty ? (
        <div className="flex flex-col items-center gap-sm rounded-lg border border-hairline bg-canvas p-xl text-center">
          <p className="font-display text-title-md">Nenhuma consulta agendada</p>
          <p className="font-body text-body-sm text-muted">
            Agende sua próxima visita ao dentista para manter o acompanhamento em dia.
          </p>
        </div>
      ) : (
        <>
          {groups.overdue.length > 0 ? (
            <section className="flex flex-col gap-md">
              <h2 className="font-display text-title-lg">Aguardando confirmação</h2>
              {groups.overdue.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))}
            </section>
          ) : null}

          {groups.upcoming.length > 0 ? (
            <section className="flex flex-col gap-md">
              <h2 className="font-display text-title-lg">Próximas</h2>
              {groups.upcoming.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))}
            </section>
          ) : null}

          {groups.past.length > 0 ? (
            <section className="flex flex-col gap-md">
              <h2 className="font-display text-title-lg">Histórico</h2>
              {groups.past.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))}
            </section>
          ) : null}
        </>
      )}

      {query.hasNextPage ? (
        <Button
          variant="secondary"
          onClick={() => query.fetchNextPage()}
          disabled={query.isFetchingNextPage}
        >
          {query.isFetchingNextPage ? "Carregando…" : "Carregar mais"}
        </Button>
      ) : null}
    </Screen>
  );
}
