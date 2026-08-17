import { Navigate, Outlet } from "react-router-dom";

import { LoadingFeedback } from "@/shared/components/ui/Feedback";

import { useAuth } from "./authContext";

/** Evita que um usuário já autenticado veja as telas de entrar/criar conta. */
export function RedirectIfAuthenticated() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingFeedback message="Carregando…" />;
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
