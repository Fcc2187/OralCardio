import { useMemo } from "react";

import { Button } from "@/shared/components/ui/Button";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { ErrorFeedback, LoadingFeedback } from "@/shared/components/ui/Feedback";
import { LinkButton } from "@/shared/components/ui/LinkButton";
import { Screen } from "@/shared/components/layout/Screen";

import { useAppointmentsInfiniteQuery } from "../api/useAppointmentQueries";
import { AppointmentCard } from "../components/AppointmentCard";
import { groupAppointments } from "../groupAppointments";

export function AppointmentsListPage() {
  const query = useAppointmentsInfiniteQuery();

  const allItems = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  );
  const groups = useMemo(() => groupAppointments(allItems, Date.now()), [allItems]);

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
        <EmptyState
          title="Nenhuma consulta agendada"
          message="Agende sua próxima visita ao dentista para manter o acompanhamento em dia."
        />
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
