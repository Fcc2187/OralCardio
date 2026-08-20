import { describe, expect, it } from "vitest";

import { validateAppEnv } from "./env";

const validProductionEnv = {
  VITE_SUPABASE_URL: "https://project.supabase.co",
  VITE_SUPABASE_ANON_KEY: "sb_publishable_example",
  VITE_API_BASE_URL: "https://api.example.com",
};

describe("validateAppEnv", () => {
  it("aceita URLs base públicas em produção", () => {
    expect(validateAppEnv(validProductionEnv, true)).toEqual({
      supabaseUrl: validProductionEnv.VITE_SUPABASE_URL,
      supabaseAnonKey: validProductionEnv.VITE_SUPABASE_ANON_KEY,
      apiBaseUrl: validProductionEnv.VITE_API_BASE_URL,
    });
  });

  it("rejeita a URL REST do Supabase no lugar da URL base", () => {
    expect(() =>
      validateAppEnv(
        {
          ...validProductionEnv,
          VITE_SUPABASE_URL: "https://project.supabase.co/rest/v1/",
        },
        true,
      ),
    ).toThrow(/sem credenciais, caminho, query ou fragmento/);
  });
});
