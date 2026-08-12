import { useQuery } from "@tanstack/react-query";

import { fetchHealthProfile, healthProfileQueryKey } from "@/shared/api/healthProfileApi";
import { useAuth } from "@/shared/auth/AuthProvider";

export function useHealthProfileQuery() {
  const { session } = useAuth();

  return useQuery({
    queryKey: healthProfileQueryKey,
    queryFn: fetchHealthProfile,
    enabled: Boolean(session),
    staleTime: 30_000,
  });
}
