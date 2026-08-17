import { getCurrentAccessToken, supabaseClient } from "@/lib/supabaseClient";
import { env } from "@/config/env";

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

interface FastApiValidationErrorItem {
  msg: string;
}

interface FastApiErrorBody {
  detail?: string | FastApiValidationErrorItem[];
}

function isFastApiErrorBody(value: unknown): value is FastApiErrorBody {
  return typeof value === "object" && value !== null && "detail" in value;
}

function extractErrorMessage(body: unknown, fallbackMessage: string): string {
  if (!isFastApiErrorBody(body)) {
    return fallbackMessage;
  }

  const { detail } = body;
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    return detail.map((item) => item.msg).join("; ");
  }

  return fallbackMessage;
}

function buildAuthHeader(): Record<string, string> {
  const accessToken = getCurrentAccessToken();
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const authHeader = buildAuthHeader();

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
      ...init?.headers,
    },
  });

  if (response.status === 401) {
    // Token ausente/expirado: encerra a sessão local. O AuthProvider reage
    // via onAuthStateChange e as rotas protegidas redirecionam para /entrar.
    await supabaseClient.auth.signOut();
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    throw new HttpError(
      extractErrorMessage(body, `Requisição falhou (${response.status}): ${path}`),
      response.status,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function serializeBody(body: unknown): string | undefined {
  return body === undefined ? undefined : JSON.stringify(body);
}

export const httpClient = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: serializeBody(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: serializeBody(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: serializeBody(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
