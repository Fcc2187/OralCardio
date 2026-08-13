import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import {
  caregiverInvitationsQueryKey,
  caregiverPatientAppointmentsQueryKey,
  caregiverPatientBrushingQueryKey,
  caregiverPatientsQueryKey,
  caregiverPatientStatsQueryKey,
} from "@/shared/api/queryKeys";

import {
  fetchPatientStats,
  listInvitations,
  listMyPatients,
  listPatientAppointments,
  listPatientBrushingSessions,
} from "./caregiverPanelApi";

const PAGE_LIMIT = 20;

export function useInvitationsQuery() {
  return useQuery({
    queryKey: caregiverInvitationsQueryKey,
    queryFn: listInvitations,
    staleTime: 30_000,
  });
}

export function useMyPatientsQuery() {
  return useQuery({
    queryKey: caregiverPatientsQueryKey,
    queryFn: listMyPatients,
    staleTime: 30_000,
  });
}

// `enabled` é como o gating por permissão granular evita disparar um
// request que a API só devolveria vazio/404 — sem isso o usuário veria um
// erro sem entender por quê (ver "Gating por permissão" no plano da fatia).
export function usePatientStatsQuery(patientId: string, enabled: boolean) {
  return useQuery({
    queryKey: caregiverPatientStatsQueryKey(patientId),
    queryFn: () => fetchPatientStats(patientId),
    staleTime: 30_000,
    enabled,
  });
}

export function usePatientBrushingSessionsInfiniteQuery(patientId: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: caregiverPatientBrushingQueryKey(patientId),
    queryFn: ({ pageParam }) =>
      listPatientBrushingSessions(patientId, { limit: PAGE_LIMIT, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.has_more && lastPage.items.length > 0
        ? lastPage.offset + lastPage.limit
        : undefined,
    staleTime: 30_000,
    enabled,
  });
}

export function usePatientAppointmentsInfiniteQuery(patientId: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: caregiverPatientAppointmentsQueryKey(patientId),
    queryFn: ({ pageParam }) =>
      listPatientAppointments(patientId, { limit: PAGE_LIMIT, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.has_more && lastPage.items.length > 0
        ? lastPage.offset + lastPage.limit
        : undefined,
    staleTime: 30_000,
    enabled,
  });
}
