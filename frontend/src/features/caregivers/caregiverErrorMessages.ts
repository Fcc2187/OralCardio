import { HttpError } from "@/shared/api/httpClient";

/** Traduz erros do backend do Modo Cuidador para mensagens que fazem
 * sentido ao usuário. Compartilhado pelo lado paciente (convidar/revogar) e
 * pelo lado cuidador (aceitar convite) — os dois usam o mesmo domínio de
 * erros. Espelha `appointmentErrorMessages.ts`. */
export function translateCaregiverError(error: unknown): string {
  if (error instanceof HttpError) {
    if (error.status === 404) {
      // POST /caregivers busca o PRÓPRIO cadastro do paciente antes de
      // convidar — um 404 aqui não é "cuidador não encontrado".
      return "Não foi possível carregar seu cadastro. Recarregue a página e tente novamente.";
    }
    if (error.status === 409) {
      return "Você já convidou esse e-mail. Confira o status na sua lista de cuidadores.";
    }
    if (error.status === 422) {
      if (error.message === "E-mail não confirmado") {
        return "Confirme o e-mail que você recebeu ao criar sua conta antes de aceitar convites.";
      }
      // As demais mensagens de 422 (autoconvite, convite inválido/já
      // utilizado/e-mail não correspondente) já são pt-BR voltado ao
      // paciente — repassar verbatim é o comportamento certo.
      return error.message;
    }
  }
  return "Algo deu errado. Tente novamente em instantes.";
}
