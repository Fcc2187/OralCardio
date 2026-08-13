import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/shared/components/ui/Button";
import { Card } from "@/shared/components/ui/Card";
import { ErrorFeedback } from "@/shared/components/ui/Feedback";
import { TextField } from "@/shared/components/ui/TextField";
import { Screen } from "@/shared/components/layout/Screen";
import { useAuth } from "@/shared/auth/AuthProvider";

import { translateAuthError } from "../authErrorMessages";

export function SignUpPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signUp({ email, password, fullName });
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
        <Link to="/entrar">
          <Button variant="secondary">Voltar para entrar</Button>
        </Link>
      </Screen>
    );
  }

  return (
    <Screen title="Criar conta" subtitle="Comece a cuidar da sua saúde bucal e cardíaca">
      <form onSubmit={handleSubmit} className="flex flex-col gap-lg" noValidate>
        <TextField
          label="Nome completo"
          autoComplete="name"
          required
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />
        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          label="Senha"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          hint="Mínimo de 6 caracteres"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <TextField
          label="Confirmar senha"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />

        {error ? <ErrorFeedback message={error} /> : null}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Criando conta…" : "Criar conta"}
        </Button>
      </form>

      <p className="text-center font-body text-body-sm text-muted">
        Já tem conta?{" "}
        <Link to="/entrar" className="text-primary-action">
          Entrar
        </Link>
      </p>
    </Screen>
  );
}
