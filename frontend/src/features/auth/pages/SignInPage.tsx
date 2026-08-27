import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/shared/components/ui/Button";
import { ErrorFeedback } from "@/shared/components/ui/Feedback";
import { TextField } from "@/shared/components/ui/TextField";
import { useAuth } from "@/shared/auth/authContext";

import { translateAuthError } from "../authErrorMessages";
import { validateSignInFields, type SignInFieldErrors } from "../authValidation";
import { AuthLayout } from "../components/AuthLayout";
import { EmailIcon, LockIcon } from "../components/AuthIcons";
import { PasswordField } from "../components/PasswordField";

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
    <AuthLayout
      mode="sign-in"
      title="Bem-vindo(a)! 👋"
      subtitle="Acesse sua conta do OralCardio"
      footer={
        <p className="font-body text-body-sm text-muted">
          Ainda não tem conta?{" "}
          <Link to="/criar-conta" className="font-semibold text-primary-action hover:underline">
            Criar conta
          </Link>
        </p>
      }
    >
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <TextField
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Digite seu e-mail"
          required
          value={email}
          error={fieldErrors.email}
          leadingIcon={<EmailIcon />}
          onChange={(event) => {
            setEmail(event.target.value);
            setFieldErrors((current) => ({ ...current, email: undefined }));
          }}
        />
        <PasswordField
          label="Senha"
          name="password"
          autoComplete="current-password"
          placeholder="Digite sua senha"
          required
          value={password}
          error={fieldErrors.password}
          leadingIcon={<LockIcon />}
          onChange={(event) => {
            setPassword(event.target.value);
            setFieldErrors((current) => ({ ...current, password: undefined }));
          }}
        />

        {/* TODO(v2.0.0): reativar ao implementar a rota de recuperação de senha.
        <div className="flex justify-end -mt-1">
          <Link
            to="/entrar"
            onClick={(e) => {
              e.preventDefault();
              setError("Para recuperar sua senha, entre em contato com o suporte ou redefina pelo link enviado ao seu e-mail.");
            }}
            className="font-body text-body-sm text-primary-action underline-offset-2 hover:underline"
          >
            Esqueceu sua senha?
          </Link>
        </div>
        */}

        {error ? <ErrorFeedback message={error} /> : null}

        <Button type="submit" disabled={isSubmitting} className="mt-1 h-12">
          {isSubmitting ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </AuthLayout>
  );
}
