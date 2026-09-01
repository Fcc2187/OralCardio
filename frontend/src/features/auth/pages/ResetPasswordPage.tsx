import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/shared/auth/authContext";
import { Button } from "@/shared/components/ui/Button";
import { ErrorFeedback, LoadingFeedback } from "@/shared/components/ui/Feedback";
import { LinkButton } from "@/shared/components/ui/LinkButton";

import { translateAuthError } from "../authErrorMessages";
import { type NewPasswordFieldErrors, validateNewPasswordFields } from "../authValidation";
import { AuthLayout } from "../components/AuthLayout";
import { LockIcon } from "../components/AuthIcons";
import { PasswordField } from "../components/PasswordField";
import { PasswordRequirements } from "../components/PasswordRequirements";

export function ResetPasswordPage() {
  const { isLoading, session, signOut, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<NewPasswordFieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const validationErrors = validateNewPasswordFields({ password, confirmPassword });
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await updatePassword(password);
      await signOut();
      navigate("/entrar", { replace: true, state: { passwordReset: true } });
    } catch (updateError) {
      setError(translateAuthError(updateError));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <LoadingFeedback message="Validando link…" />;

  if (!session) {
    return (
      <AuthLayout
        mode="sign-in"
        title="Link inválido"
        subtitle="Não foi possível validar sua recuperação"
        footer={<LinkButton to="/entrar" variant="secondary">Voltar para entrar</LinkButton>}
      >
        <p className="font-body text-body-md text-body">
          Este link de recuperação é inválido ou expirou.
        </p>
        <LinkButton to="/esqueci-senha" className="mt-4">
          Solicitar outro link
        </LinkButton>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      mode="sign-in"
      title="Criar nova senha"
      subtitle="Escolha uma senha segura para sua conta"
      footer={<LinkButton to="/entrar" variant="secondary">Cancelar</LinkButton>}
    >
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <PasswordField
          label="Nova senha"
          name="password"
          autoComplete="new-password"
          placeholder="Digite sua nova senha"
          aria-describedby="reset-password-requirements"
          required
          minLength={8}
          value={password}
          error={fieldErrors.password}
          leadingIcon={<LockIcon />}
          onChange={(event) => {
            setPassword(event.target.value);
            setFieldErrors((current) => ({ ...current, password: undefined }));
          }}
        />
        <PasswordField
          label="Confirmar nova senha"
          name="confirm-password"
          autoComplete="new-password"
          placeholder="Digite novamente sua nova senha"
          required
          value={confirmPassword}
          error={fieldErrors.confirmPassword}
          leadingIcon={<LockIcon />}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            setFieldErrors((current) => ({ ...current, confirmPassword: undefined }));
          }}
        />
        <PasswordRequirements id="reset-password-requirements" password={password} />

        {error ? <ErrorFeedback message={error} /> : null}

        <Button type="submit" disabled={isSubmitting} className="mt-1 h-12">
          {isSubmitting ? "Alterando…" : "Alterar senha"}
        </Button>
      </form>
    </AuthLayout>
  );
}
