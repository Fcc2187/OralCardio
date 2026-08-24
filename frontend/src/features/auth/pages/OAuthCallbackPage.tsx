import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Screen } from "@/shared/components/layout/Screen";
import { useAuth } from "@/shared/auth/authContext";

import { clearOAuthReturnPath, consumeOAuthReturnPath } from "../oauthReturnPath";

export function OAuthCallbackPage() {
  const { isLoading, session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (session) {
      navigate(consumeOAuthReturnPath(), { replace: true });
    } else {
      clearOAuthReturnPath();
    }
  }, [isLoading, navigate, session]);

  if (isLoading || session) {
    return <Screen title="Entrando"><p className="font-body text-body-md text-muted">Aguarde…</p></Screen>;
  }

  return (
    <Screen title="Não foi possível entrar com Google">
      <p className="font-body text-body-md text-body">Tente novamente ou entre com e-mail e senha.</p>
      <Link to="/entrar" className="font-body text-body-md text-primary-action underline underline-offset-2">
        Voltar para entrar
      </Link>
    </Screen>
  );
}
