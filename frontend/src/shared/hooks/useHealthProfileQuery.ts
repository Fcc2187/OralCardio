import { useQuery } from "@tanstack/react-query";

import { fetchHealthProfile } from "@/shared/api/healthProfileApi";
import { healthProfileQueryKey } from "@/shared/api/queryKeys";
import { useAuth } from "@/shared/auth/authContext";

export function useHealthProfileQuery() {
  const { session } = useAuth();

  return useQuery({
    queryKey: healthProfileQueryKey,
    queryFn: fetchHealthProfile,
    enabled: Boolean(session),
    staleTime: 30_000,
  });
}
