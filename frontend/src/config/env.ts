interface AppEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
  apiBaseUrl: string;
}

function readRequiredEnvVar(key: string): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(
      `Variável de ambiente ausente: ${key}. Verifique o arquivo .env (veja .env.example).`,
    );
  }
  return value;
}

export const env: AppEnv = {
  supabaseUrl: readRequiredEnvVar("VITE_SUPABASE_URL"),
  supabaseAnonKey: readRequiredEnvVar("VITE_SUPABASE_ANON_KEY"),
  apiBaseUrl: readRequiredEnvVar("VITE_API_BASE_URL"),
};
