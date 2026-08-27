const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

export interface SignInFieldValues {
  email: string;
  password: string;
}

export interface SignUpFieldValues extends SignInFieldValues {
  fullName: string;
  confirmPassword: string;
}

export type SignInFieldErrors = Partial<Record<keyof SignInFieldValues, string>>;

export type SignUpFieldErrors = Partial<Record<keyof SignUpFieldValues, string>>;

export function validateSignInFields({ email, password }: SignInFieldValues): SignInFieldErrors {
  const errors: SignInFieldErrors = {};

  if (!EMAIL_PATTERN.test(email.trim())) {
    errors.email = "Informe um e-mail válido.";
  }
  if (password.length === 0) {
    errors.password = "Informe sua senha.";
  }

  return errors;
}

export function validateSignUpFields({
  fullName,
  email,
  password,
  confirmPassword,
}: SignUpFieldValues): SignUpFieldErrors {
  const errors: SignUpFieldErrors = {};

  if (fullName.trim().length === 0) {
    errors.fullName = "Informe seu nome completo.";
  }
  if (!EMAIL_PATTERN.test(email.trim())) {
    errors.email = "Informe um e-mail válido.";
  }
  if (password.length < 6) {
    errors.password = "A senha precisa ter pelo menos 6 caracteres.";
  }
  if (password !== confirmPassword) {
    errors.confirmPassword = "As senhas não coincidem.";
  }

  return errors;
}
