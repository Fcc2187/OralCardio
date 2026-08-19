import { Navigate, Outlet, useLocation } from "react-router-dom";

import { LoadingFeedback } from "@/shared/components/ui/Feedback";
import { ErrorFeedback } from "@/shared/components/ui/Feedback";
import { RetryButton } from "@/shared/components/ui/RetryButton";
import { Screen } from "@/shared/components/layout/Screen";
import { useHealthProfileQuery } from "@/shared/hooks/useHealthProfileQuery";

import { useAuth } from "./authContext";

interface ProtectedRouteProps {
  /** Perfil de saúde precisa estar completo para acessar a rota. Desligado
   * apenas na própria rota do questionário — ver seção 3.1 da documentação:
   * "acesso pleno só após health_profiles.is_completed = TRUE". */
  requireCompletedProfile?: boolean;
}

export function ProtectedRoute({ requireCompletedProfile = true }: ProtectedRouteProps) {
  const { session, isLoading: isAuthLoading } = useAuth();
  const location = useLocation();
  const healthProfileQuery = useHealthProfileQuery();

  if (isAuthLoading) {
    return <LoadingFeedback message="Verificando sua sessão…" />;
  }

  if (!session) {
    return <Navigate to="/entrar" replace state={{ from: location }} />;
  }

  if (requireCompletedProfile) {
    if (healthProfileQuery.isPending) {
      return <LoadingFeedback message="Carregando seu perfil…" />;
    }

    if (healthProfileQuery.isError) {
      return (
        <Screen title="Não foi possível validar seu perfil">
          <ErrorFeedback message="Verifique sua conexão e tente novamente." />
          <RetryButton onRetry={() => healthProfileQuery.refetch()} />
        </Screen>
      );
    }

    if (healthProfileQuery.data?.is_completed === false) {
      return <Navigate to="/questionario" replace />;
    }
  }

  return <Outlet />;
}
