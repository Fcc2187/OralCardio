import { httpClient, type HttpRequestOptions } from "@/shared/api/httpClient";

export interface FlossingLog {
  id: string;
  user_id: string;
  logged_at: string;
  notes: string | null;
}

// Corpo obrigatório: FlossingLogInput não tem default no FastAPI, então uma
// requisição sem body vira 422.
export function logFlossing(
  notes: string | null = null,
  options?: HttpRequestOptions,
): Promise<FlossingLog> {
  return httpClient.post<FlossingLog>("/api/v1/flossing-logs", { notes }, options);
}
