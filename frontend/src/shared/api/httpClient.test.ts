import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentAccessToken = vi.fn();
const signOut = vi.fn();

vi.mock("@/lib/supabaseClient", () => ({
  supabaseClient: {
    auth: {
      signOut,
    },
  },
  getCurrentAccessToken,
}));

vi.mock("@/config/env", () => ({
  env: {
    apiBaseUrl: "https://api.test",
    supabaseUrl: "https://supabase.test",
    supabaseAnonKey: "anon-key",
  },
}));

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("httpClient", () => {
  beforeEach(() => {
    getCurrentAccessToken.mockReturnValue(null);
    signOut.mockResolvedValue(undefined);
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("attaches the Supabase access token as a bearer header when a session exists", async () => {
    getCurrentAccessToken.mockReturnValue("token-123");
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { ok: true }));

    const { httpClient } = await import("./httpClient");
    await httpClient.get("/api/v1/example");

    const [, init] = vi.mocked(fetch).mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer token-123");
  });

  it("omits the Authorization header when there is no session", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { ok: true }));

    const { httpClient } = await import("./httpClient");
    await httpClient.get("/api/v1/example");

    const [, init] = vi.mocked(fetch).mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it("translates a FastAPI {detail: string} error body into an HttpError", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(422, { detail: "Todas as 5 zonas da boca precisam ser concluídas" }),
    );

    const { httpClient, HttpError } = await import("./httpClient");

    await expect(httpClient.get("/api/v1/example")).rejects.toMatchObject({
      message: "Todas as 5 zonas da boca precisam ser concluídas",
      status: 422,
    });
    await expect(httpClient.get("/api/v1/example")).rejects.toBeInstanceOf(HttpError);
  });

  it("translates a FastAPI validation-array {detail} body into a joined message", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(422, { detail: [{ msg: "campo obrigatório" }, { msg: "valor inválido" }] }),
    );

    const { httpClient } = await import("./httpClient");

    await expect(httpClient.get("/api/v1/example")).rejects.toMatchObject({
      message: "campo obrigatório; valor inválido",
    });
  });

  it("signs the user out on a 401 response", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(401, { detail: "Não autenticado" }));

    const { httpClient } = await import("./httpClient");
    await expect(httpClient.get("/api/v1/example")).rejects.toMatchObject({ status: 401 });

    expect(signOut).toHaveBeenCalledOnce();
  });
});
