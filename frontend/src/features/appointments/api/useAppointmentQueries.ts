import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { appointmentQueryKey, appointmentsListQueryKey } from "@/shared/api/queryKeys";

import { fetchAppointment, listAppointments } from "./appointmentsApi";

// 50 (o máximo é 100) cobre o paciente realista numa única página. O cursor
// de (data, id) mantém a navegação estável mesmo com novas consultas entrando.
const PAGE_LIMIT = 50;

export function useAppointmentsInfiniteQuery() {
  return useInfiniteQuery({
    queryKey: appointmentsListQueryKey,
    queryFn: ({ pageParam }) => listAppointments({ limit: PAGE_LIMIT, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    staleTime: 30_000,
  });
}

export function useAppointmentQuery(id: string) {
  return useQuery({
    queryKey: appointmentQueryKey(id),
    queryFn: () => fetchAppointment(id),
    staleTime: 30_000,
  });
}
