import { getCurrentAccessToken } from "@/lib/supabaseClient";
import { env } from "@/config/env";
import { requestSessionSignOut } from "@/shared/auth/sessionLifecycle";

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export class HttpTimeoutError extends Error {
  constructor(public readonly path: string) {
    super("A requisição demorou mais que o esperado. Verifique sua conexão e tente novamente.");
    this.name = "HttpTimeoutError";
  }
}

export class HttpContractError extends Error {
  constructor(public readonly path: string) {
    super("A resposta do servidor não está no formato esperado.");
    this.name = "HttpContractError";
  }
}

export interface HttpRequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  /** Deve ser criada no início da intenção do usuário e reutilizada no retry. */
  idempotencyKey?: string;
}

const DEFAULT_TIMEOUT_MS = 15_000;

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

function withTimeout(signal: AbortSignal | undefined, timeoutMs: number) {
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const abortFromCaller = () => controller.abort();
  signal?.addEventListener("abort", abortFromCaller, { once: true });

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    dispose: () => {
      window.clearTimeout(timeoutId);
      signal?.removeEventListener("abort", abortFromCaller);
    },
  };
}

async function request<T>(path: string, init?: RequestInit, options: HttpRequestOptions = {}): Promise<T> {
  const authHeader = buildAuthHeader();
  const timeout = withTimeout(options.signal, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  let response: Response;

  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, {
      ...init,
      signal: timeout.signal,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
        ...init?.headers,
      },
    });
  } catch (error) {
    if (timeout.didTimeout()) throw new HttpTimeoutError(path);
    throw error;
  } finally {
    timeout.dispose();
  }

  if (response.status === 401) {
    // Token ausente/expirado: encerra a sessão local. O AuthProvider reage
    // via onAuthStateChange e as rotas protegidas redirecionam para /entrar.
    await requestSessionSignOut();
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

export function createIdempotencyKey(): string {
  return crypto.randomUUID();
}

export const httpClient = {
  get: <T>(path: string, options?: HttpRequestOptions) => request<T>(path, { method: "GET" }, options),
  post: <T>(path: string, body?: unknown, options: HttpRequestOptions = {}) =>
    request<T>(path, {
      method: "POST",
      body: serializeBody(body),
      headers: { "Idempotency-Key": options.idempotencyKey ?? createIdempotencyKey() },
    }, options),
  put: <T>(path: string, body?: unknown, options?: HttpRequestOptions) =>
    request<T>(path, { method: "PUT", body: serializeBody(body) }, options),
  patch: <T>(path: string, body?: unknown, options?: HttpRequestOptions) =>
    request<T>(path, { method: "PATCH", body: serializeBody(body) }, options),
  delete: <T>(path: string, body?: unknown, options?: HttpRequestOptions) =>
    request<T>(path, { method: "DELETE", body: serializeBody(body) }, options),
};
