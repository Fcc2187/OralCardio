import { Plus } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/shared/components/ui/Button";
import { ErrorFeedback, LoadingFeedback } from "@/shared/components/ui/Feedback";
import { Screen } from "@/shared/components/layout/Screen";
import { useCurrentTime } from "@/shared/hooks/useCurrentTime";

import { useAppointmentsInfiniteQuery } from "../api/useAppointmentQueries";
import { AppointmentCard } from "../components/AppointmentCard";
import { groupAppointments } from "../groupAppointments";
import type { Appointment } from "../types";

export function AppointmentsListPage() {
  const query = useAppointmentsInfiniteQuery();
  const now = useCurrentTime();
  const headingRef = useRef<HTMLHeadingElement>(null);

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

  useEffect(() => {
    if (!query.isPending && !query.isError) {
      headingRef.current?.focus();
    }
  }, [query.isPending, query.isError]);

  if (query.isPending) {
    return <LoadingFeedback message="Carregando sua agenda…" />;
  }

  if (query.isError) {
    return (
      <Screen title="Agenda" maxWidth="wide">
        <ErrorFeedback message="Não foi possível carregar sua agenda. Tente novamente em instantes." />
      </Screen>
    );
  }

  const isEmpty = allItems.length === 0;

  return (
    <Screen title="Agenda" maxWidth="wide" hideHeader className="relative">
      {/* Editorial Header */}
      <header className="flex flex-col">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-[2.2rem] font-normal leading-tight text-ink outline-none min-[640px]:text-[2.6rem]"
        >
          Agenda
        </h1>
        <div className="mt-2 flex items-center gap-1.5 text-primary-action" aria-hidden="true">
          <span className="h-px w-20 bg-primary-action/40 min-[640px]:w-28" />
          <svg className="size-2.5 fill-primary-action" viewBox="0 0 24 24">
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
          </svg>
        </div>
      </header>

      {/* Wide Coral CTA Button */}
      <Link
        to="/agenda/nova"
        className="relative flex min-h-tap-target-min w-full items-center justify-center rounded-2xl bg-primary-action px-6 py-4 font-display text-[1.15rem] font-medium text-white shadow-sm transition-all hover:bg-primary-pressed active:scale-[0.99] min-[640px]:text-title-lg focus-visible:ring-2 focus-visible:ring-primary-action focus-visible:ring-offset-2"
      >
        <span>Nova consulta</span>
        <span
          aria-hidden="true"
          className="absolute right-4 flex size-8 items-center justify-center rounded-full border border-white/40 text-white min-[640px]:right-6"
        >
          <Plus className="size-5" />
        </span>
      </Link>

      {isEmpty ? (
        <div className="flex flex-col items-center gap-sm rounded-2xl border border-hairline bg-white/80 p-xl text-center shadow-xs">
          <p className="font-display text-title-md text-ink">Nenhuma consulta agendada</p>
          <p className="font-body text-body-sm text-muted">
            Agende sua próxima visita ao dentista para manter o acompanhamento em dia.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.overdue.length > 0 ? (
            <section className="flex flex-col gap-4">
              <h2 className="font-display text-[1.4rem] font-normal text-ink min-[640px]:text-[1.6rem]">
                Aguardando confirmação
              </h2>
              <div className="flex flex-col gap-4">
                {groups.overdue.map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))}
              </div>
            </section>
          ) : null}

          {groups.upcoming.length > 0 ? (
            <section className="flex flex-col gap-4">
              <h2 className="font-display text-[1.4rem] font-normal text-ink min-[640px]:text-[1.6rem]">
                Próximas
              </h2>
              <div className="flex flex-col gap-4">
                {groups.upcoming.map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))}
              </div>
            </section>
          ) : null}

          {groups.past.length > 0 ? (
            <section className="flex flex-col gap-4">
              <h2 className="font-display text-[1.4rem] font-normal text-ink min-[640px]:text-[1.6rem]">
                Histórico
              </h2>
              <div className="flex flex-col gap-4">
                {groups.past.map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
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
