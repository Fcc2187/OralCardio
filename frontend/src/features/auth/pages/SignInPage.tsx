import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/shared/components/ui/Button";
import { ErrorFeedback } from "@/shared/components/ui/Feedback";
import { TextField } from "@/shared/components/ui/TextField";
import { Screen } from "@/shared/components/layout/Screen";
import { useAuth } from "@/shared/auth/authContext";

import { translateAuthError } from "../authErrorMessages";
import { validateSignInFields, type SignInFieldErrors } from "../authValidation";

interface LocationState {
  from?: { pathname: string };
}

export function SignInPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<SignInFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const validationErrors = validateSignInFields({ email, password });
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    setIsSubmitting(true);

    try {
      await signIn(email.trim(), password);
      const state = location.state as LocationState | null;
      navigate(state?.from?.pathname ?? "/", { replace: true });
    } catch (signInError) {
      setError(translateAuthError(signInError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen title="Entrar" subtitle="Acesse sua conta do OralCardio">
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-lg">
        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          required
          value={email}
          error={fieldErrors.email}
          onChange={(event) => {
            setEmail(event.target.value);
            setFieldErrors((current) => ({ ...current, email: undefined }));
          }}
        />
        <TextField
          label="Senha"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          error={fieldErrors.password}
          onChange={(event) => {
            setPassword(event.target.value);
            setFieldErrors((current) => ({ ...current, password: undefined }));
          }}
        />

        {error ? <ErrorFeedback message={error} /> : null}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Entrando…" : "Entrar"}
        </Button>
      </form>

      <p className="text-center font-body text-body-sm text-muted">
        Ainda não tem conta?{" "}
        <Link to="/criar-conta" className="text-primary-action underline underline-offset-2">
          Criar conta
        </Link>
      </p>
    </Screen>
  );
}
