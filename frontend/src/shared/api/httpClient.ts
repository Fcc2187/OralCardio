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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new HttpError(`Requisição falhou: ${path}`, response.status);
  }

  return (await response.json()) as T;
}

export const httpClient = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
};
