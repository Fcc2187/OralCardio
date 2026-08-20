interface AppEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
  apiBaseUrl: string;
}

interface RawEnv {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_API_BASE_URL?: string;
}

function readRequiredEnvVar(rawEnv: RawEnv, key: keyof RawEnv): string {
  const value = rawEnv[key];
  if (!value) {
    throw new Error(
      `Variável de ambiente ausente: ${key}. Verifique o arquivo .env (veja .env.example).`,
    );
  }
  return value;
}

export function validateAppEnv(rawEnv: RawEnv, strictProduction = false): AppEnv {
  const supabaseUrl = readRequiredEnvVar(rawEnv, "VITE_SUPABASE_URL");
  const supabaseAnonKey = readRequiredEnvVar(rawEnv, "VITE_SUPABASE_ANON_KEY");
  const apiBaseUrl = readRequiredEnvVar(rawEnv, "VITE_API_BASE_URL");

  let parsedSupabaseUrl: URL;
  let parsedApiUrl: URL;
  try {
    parsedSupabaseUrl = new URL(supabaseUrl);
    parsedApiUrl = new URL(apiBaseUrl);
  } catch {
    throw new Error("As URLs do Supabase e da API precisam ser válidas.");
  }

  if (strictProduction) {
    const forbiddenHosts = new Set(["localhost", "127.0.0.1", "::1"]);
    for (const url of [parsedSupabaseUrl, parsedApiUrl]) {
      if (
        url.protocol !== "https:" ||
        forbiddenHosts.has(url.hostname) ||
        url.username ||
        url.password ||
        url.pathname !== "/" ||
        url.search ||
        url.hash
      ) {
        throw new Error(
          "Produção exige URLs HTTPS públicas, sem credenciais, caminho, query ou fragmento.",
        );
      }
    }
    if (!parsedSupabaseUrl.hostname.endsWith(".supabase.co")) {
      throw new Error("A URL de produção do Supabase precisa usar o domínio público do projeto.");
    }
  }

  return { supabaseUrl, supabaseAnonKey, apiBaseUrl };
}

export const env = validateAppEnv(
  import.meta.env,
  import.meta.env.VITE_DEPLOYMENT_ENV === "production",
);
