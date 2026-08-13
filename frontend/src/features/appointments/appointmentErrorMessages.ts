import { HttpError } from "@/shared/api/httpClient";

/** Traduz erros do backend de consultas para mensagens que fazem sentido
 * para o paciente. A string de transição de status inválida
 * ("Transição de status inválida: X → Y") é voltada ao desenvolvedor — nunca
 * deve aparecer verbatim na tela (precedente: features/auth/authErrorMessages.ts). */
export function translateAppointmentError(error: unknown): string {
  if (error instanceof HttpError) {
    if (error.status === 404) {
      return "Consulta não encontrada.";
    }
    if (error.message.includes("Transição de status inválida")) {
      return "Essa consulta já foi concluída ou cancelada. Atualize a página.";
    }
    if (error.status === 422) {
      return "Verifique os dados informados e tente novamente.";
    }
  }
  return "Algo deu errado. Tente novamente em instantes.";
}
