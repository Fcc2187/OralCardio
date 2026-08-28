/** Traduz as mensagens mais comuns de erro do Supabase Auth (em inglês) para
 * um texto que faça sentido para o paciente. Mensagens não mapeadas caem
 * num fallback genérico em vez de vazar o texto original em inglês. */
export function translateAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  const details = error as { code?: unknown; reasons?: unknown } | null;
  const reasons = Array.isArray(details?.reasons) ? details.reasons : [];

  if (details?.code === "weak_password") {
    if (reasons.includes("length")) {
      return "A senha precisa ter pelo menos 8 caracteres.";
    }
    if (reasons.includes("characters")) {
      return "Inclua letras maiúsculas e minúsculas, um número e um caractere especial.";
    }
    if (reasons.includes("pwned")) {
      return "Esta senha é muito comum ou já foi comprometida.";
    }
    return "Esta senha não atende aos requisitos de segurança.";
  }
  if (details?.code === "over_request_rate_limit" || details?.code === "over_email_send_rate_limit") {
    return "Muitas tentativas. Aguarde alguns instantes e tente novamente.";
  }
  if (details?.code === "validation_failed") {
    return "Os dados informados não atendem aos requisitos de segurança.";
  }

  if (message.includes("Invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (message.includes("Email not confirmed")) {
    return "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.";
  }
  if (message.includes("User already registered")) {
    return "Este e-mail já está cadastrado. Tente entrar em vez de criar uma nova conta.";
  }
  if (message.includes("Password should be at least")) {
    return "A senha precisa ter pelo menos 8 caracteres.";
  }

  return "Algo deu errado. Verifique os dados e tente novamente.";
}
