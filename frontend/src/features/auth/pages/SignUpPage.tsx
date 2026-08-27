import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { ErrorFeedback } from "@/shared/components/ui/Feedback";
import { TextField } from "@/shared/components/ui/TextField";
import { Screen } from "@/shared/components/layout/Screen";
import { LinkButton } from "@/shared/components/ui/LinkButton";
import { useAuth } from "@/shared/auth/authContext";

import { translateAuthError } from "../authErrorMessages";
import { type SignUpFieldErrors, validateSignUpFields } from "../authValidation";

export function SignUpPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<SignUpFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationErrors = validateSignUpFields({ fullName, email, password, confirmPassword });
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const normalizedName = fullName.trim();
    setIsSubmitting(true);
    try {
      const result = await signUp({ email: email.trim(), password, fullName: normalizedName });
      if (result.needsEmailConfirmation) {
        setNeedsEmailConfirmation(true);
      } else {
        navigate("/", { replace: true });
      }
    } catch (signUpError) {
      setError(translateAuthError(signUpError));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (needsEmailConfirmation) {
    return (
      <Screen title="Quase lá">
        <Card variant="canvas">
          <p className="font-body text-body-md text-body">
            Enviamos um link de confirmação para <strong>{email}</strong>. Abra seu e-mail e
            confirme a conta para poder entrar.
          </p>
        </Card>
        <LinkButton to="/entrar" variant="secondary">Voltar para entrar</LinkButton>
      </Screen>
    );
  }

  return (
    <Screen title="Criar conta" subtitle="Comece a cuidar da sua saúde bucal e cardíaca">
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-lg">
        <TextField
          label="Nome completo"
          autoComplete="name"
          required
          value={fullName}
          error={fieldErrors.fullName}
          onChange={(event) => {
            setFullName(event.target.value);
            setFieldErrors((current) => ({ ...current, fullName: undefined }));
          }}
        />
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
          autoComplete="new-password"
          required
          minLength={6}
          hint="Mínimo de 6 caracteres"
          value={password}
          error={fieldErrors.password}
          onChange={(event) => {
            setPassword(event.target.value);
            setFieldErrors((current) => ({ ...current, password: undefined }));
          }}
        />
        <TextField
          label="Confirmar senha"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          error={fieldErrors.confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            setFieldErrors((current) => ({ ...current, confirmPassword: undefined }));
          }}
        />

        {error ? <ErrorFeedback message={error} /> : null}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Criando conta…" : "Criar conta"}
        </Button>
      </form>

      <p className="text-center font-body text-body-sm text-muted">
        Já tem conta?{" "}
        <Link to="/entrar" className="text-primary-action underline underline-offset-2">
          Entrar
        </Link>
      </p>
    </Screen>
  );
}
