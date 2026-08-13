/** Traduz as mensagens mais comuns de erro do Supabase Auth (em inglês) para
 * um texto que faça sentido para o paciente. Mensagens não mapeadas caem
 * num fallback genérico em vez de vazar o texto original em inglês. */
export function translateAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";

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
    return "A senha precisa ter pelo menos 6 caracteres.";
  }

  return "Algo deu errado. Verifique os dados e tente novamente.";
}
