import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/shared/components/ui/Button";
import { ErrorFeedback } from "@/shared/components/ui/Feedback";
import { TextField } from "@/shared/components/ui/TextField";
import { LinkButton } from "@/shared/components/ui/LinkButton";
import { useAuth } from "@/shared/auth/authContext";

import { translateAuthError } from "../authErrorMessages";
import { type SignUpFieldErrors, validateSignUpFields } from "../authValidation";
import { AuthLayout } from "../components/AuthLayout";
import { EmailIcon, LockIcon, UserIcon } from "../components/AuthIcons";
import { PasswordField } from "../components/PasswordField";

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
      <AuthLayout
        mode="sign-up"
        title="Quase lá"
        subtitle="Confirme seu e-mail para continuar"
        footer={<LinkButton to="/entrar" variant="secondary">Voltar para entrar</LinkButton>}
      >
        <p className="font-body text-body-md text-body">
          Enviamos um link de confirmação para <strong>{email}</strong>. Abra seu e-mail e
          confirme a conta para poder entrar.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      mode="sign-up"
      title="Criar conta"
      subtitle="Comece a cuidar da sua saúde bucal e cardíaca"
      footer={
        <p className="font-body text-body-sm text-muted">
          Já tem conta?{" "}
          <Link to="/entrar" className="text-primary-action underline underline-offset-2">
            Entrar
          </Link>
        </p>
      }
    >
      <form noValidate onSubmit={handleSubmit} className="grid gap-md min-[1024px]:grid-cols-2">
        <TextField
          label="Nome completo"
          name="name"
          autoComplete="name"
          placeholder="Digite seu nome"
          required
          value={fullName}
          error={fieldErrors.fullName}
          leadingIcon={<UserIcon />}
          onChange={(event) => {
            setFullName(event.target.value);
            setFieldErrors((current) => ({ ...current, fullName: undefined }));
          }}
        />
        <PasswordField
          label="Senha"
          name="password"
          autoComplete="new-password"
          placeholder="Mínimo de 6 caracteres"
          required
          minLength={6}
          hint="Mínimo de 6 caracteres"
          value={password}
          error={fieldErrors.password}
          leadingIcon={<LockIcon />}
          onChange={(event) => {
            setPassword(event.target.value);
            setFieldErrors((current) => ({ ...current, password: undefined }));
          }}
        />
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
          label="Confirmar senha"
          name="confirm-password"
          autoComplete="new-password"
          placeholder="Digite novamente sua senha"
          required
          value={confirmPassword}
          error={fieldErrors.confirmPassword}
          leadingIcon={<LockIcon />}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            setFieldErrors((current) => ({ ...current, confirmPassword: undefined }));
          }}
        />

        {error ? <div className="min-[1024px]:col-span-2"><ErrorFeedback message={error} /></div> : null}

        <Button type="submit" disabled={isSubmitting} className="mt-xs min-[1024px]:col-span-2">
          {isSubmitting ? "Criando conta…" : "Criar conta"}
        </Button>
      </form>
    </AuthLayout>
  );
}
