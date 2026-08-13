import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { appointmentQueryKey, appointmentsListQueryKey } from "@/shared/api/queryKeys";

import { fetchAppointment, listAppointments } from "./appointmentsApi";

// 50 (o máximo é 100) cobre o paciente realista numa única página — a
// paginação por offset da API só existe para o caso extremo.
const PAGE_LIMIT = 50;

export function useAppointmentsInfiniteQuery() {
  return useInfiniteQuery({
    queryKey: appointmentsListQueryKey,
    queryFn: ({ pageParam }) => listAppointments({ limit: PAGE_LIMIT, offset: pageParam }),
    initialPageParam: 0,
    // has_more é heurístico (true sempre que uma página cheia volta), então
    // uma página final vazia é possível — o guard de items.length > 0 cobre
    // esse caso sem precisar de estado manual.
    getNextPageParam: (lastPage) =>
      lastPage.has_more && lastPage.items.length > 0 ? lastPage.offset + lastPage.limit : undefined,
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
