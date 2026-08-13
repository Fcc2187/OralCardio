import { useQuery } from "@tanstack/react-query";

import { dashboardQueryKey } from "@/shared/api/queryKeys";

import { fetchDashboard } from "./dashboardApi";

export function useDashboardQuery() {
  return useQuery({
    queryKey: dashboardQueryKey,
    queryFn: fetchDashboard,
    staleTime: 30_000,
  });
}
