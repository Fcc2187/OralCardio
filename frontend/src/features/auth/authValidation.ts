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
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.password = "Esta senha é muito comum. Escolha outra senha.";
  } else if (password.length < 8) {
    errors.password = "A senha precisa ter pelo menos 8 caracteres.";
  } else if (!/[A-Z]/.test(password)) {
    errors.password = "Inclua pelo menos uma letra maiúscula.";
  } else if (!LOWERCASE_LETTER_PATTERN.test(password)) {
    errors.password = "Inclua pelo menos uma letra minúscula.";
  } else if (!DIGIT_PATTERN.test(password)) {
    errors.password = "Inclua pelo menos um número.";
  } else if (!SPECIAL_CHARACTER_PATTERN.test(password)) {
    errors.password = "Inclua pelo menos um caractere especial.";
  }
  if (password !== confirmPassword) {
    errors.confirmPassword = "As senhas não coincidem.";
  }

  return errors;
}
