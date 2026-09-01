import { useState, type FormEvent } from "react";

import { useAuth } from "@/shared/auth/authContext";
import { Button } from "@/shared/components/ui/Button";
import { ErrorFeedback } from "@/shared/components/ui/Feedback";
import { LinkButton } from "@/shared/components/ui/LinkButton";
import { TextField } from "@/shared/components/ui/TextField";

import { translateAuthError } from "../authErrorMessages";
import {
  type PasswordResetRequestFieldErrors,
  validatePasswordResetRequestFields,
} from "../authValidation";
import { AuthLayout } from "../components/AuthLayout";
import { EmailIcon } from "../components/AuthIcons";

const NEUTRAL_RESPONSE =
  "Se existir uma conta para este e-mail, enviaremos as instruções de recuperação.";

export function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<PasswordResetRequestFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wasRequested, setWasRequested] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const validationErrors = validatePasswordResetRequestFields({ email });
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      setWasRequested(true);
    } catch (requestError) {
      setError(translateAuthError(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (wasRequested) {
    return (
      <AuthLayout
        mode="sign-in"
        title="Verifique seu e-mail"
        subtitle="Enviamos as instruções de recuperação"
        footer={<LinkButton to="/entrar" variant="secondary">Voltar para entrar</LinkButton>}
      >
        <p role="status" className="font-body text-body-md text-body">
          {NEUTRAL_RESPONSE}
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      mode="sign-in"
      title="Recuperar senha"
      subtitle="Informe seu e-mail para receber as instruções"
      footer={<LinkButton to="/entrar" variant="secondary">Voltar para entrar</LinkButton>}
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
            setFieldErrors({});
          }}
        />

        {error ? <ErrorFeedback message={error} /> : null}

        <Button type="submit" disabled={isSubmitting} className="mt-1 h-12">
          {isSubmitting ? "Enviando…" : "Enviar instruções"}
        </Button>
      </form>
    </AuthLayout>
  );
}
