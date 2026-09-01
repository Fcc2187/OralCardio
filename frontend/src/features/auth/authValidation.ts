const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const LOWERCASE_LETTER_PATTERN = /[a-z]/;
const DIGIT_PATTERN = /\d/;
const SPECIAL_CHARACTER_PATTERN = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;

// ponytail: shortlist for immediate feedback; keep Supabase Auth as the enforcement boundary.
const COMMON_PASSWORDS = new Set([
  "password", "123456", "12345678", "1234", "qwerty", "12345", "dragon", "pussy",
  "baseball", "football", "letmein", "monkey", "696969", "abc123", "mustang", "michael",
  "shadow", "master", "jennifer", "111111", "2000", "jordan", "superman", "harley",
  "1234567", "fuckme", "hunter", "fuckyou", "trustno1", "ranger",
]);

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

export interface PasswordResetRequestFieldValues {
  email: string;
}

export interface NewPasswordFieldValues {
  password: string;
  confirmPassword: string;
}

export type PasswordResetRequestFieldErrors = Partial<Record<"email", string>>;

export type NewPasswordFieldErrors = Partial<Record<keyof NewPasswordFieldValues, string>>;

export interface PasswordRequirementsStatus {
  hasMinLength: boolean;
  hasUpperAndLower: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export function checkPasswordRequirements(password: string): PasswordRequirementsStatus {
  return {
    hasMinLength: password.length >= 8,
    hasUpperAndLower: /[A-Z]/.test(password) && LOWERCASE_LETTER_PATTERN.test(password),
    hasNumber: DIGIT_PATTERN.test(password),
    hasSpecialChar: SPECIAL_CHARACTER_PATTERN.test(password),
  };
}

function validateEmail(email: string): string | undefined {
  return EMAIL_PATTERN.test(email.trim()) ? undefined : "Informe um e-mail válido.";
}

function validatePassword(password: string): string | undefined {
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return "Esta senha é muito comum. Escolha outra senha.";
  }
  if (password.length < 8) return "A senha precisa ter pelo menos 8 caracteres.";
  if (!/[A-Z]/.test(password)) return "Inclua pelo menos uma letra maiúscula.";
  if (!LOWERCASE_LETTER_PATTERN.test(password)) {
    return "Inclua pelo menos uma letra minúscula.";
  }
  if (!DIGIT_PATTERN.test(password)) return "Inclua pelo menos um número.";
  if (!SPECIAL_CHARACTER_PATTERN.test(password)) {
    return "Inclua pelo menos um caractere especial.";
  }
  return undefined;
}

export function validatePasswordResetRequestFields({
  email,
}: PasswordResetRequestFieldValues): PasswordResetRequestFieldErrors {
  const error = validateEmail(email);
  return error ? { email: error } : {};
}

export function validateNewPasswordFields({
  password,
  confirmPassword,
}: NewPasswordFieldValues): NewPasswordFieldErrors {
  const errors: NewPasswordFieldErrors = {};
  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;
  if (password !== confirmPassword) {
    errors.confirmPassword = "As senhas não coincidem.";
  }
  return errors;
}

export function validateSignInFields({ email, password }: SignInFieldValues): SignInFieldErrors {
  const errors: SignInFieldErrors = {};

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
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
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;
  if (password !== confirmPassword) {
    errors.confirmPassword = "As senhas não coincidem.";
  }

  return errors;
}
