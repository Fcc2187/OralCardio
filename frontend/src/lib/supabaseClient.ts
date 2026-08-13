import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env } from "@/config/env";

export const supabaseClient: SupabaseClient = createClient(env.supabaseUrl, env.supabaseAnonKey);

// Fonte única do token de acesso atual. É escrita pelo AuthProvider — o
// mesmo lugar que decide isLoading/session para o resto do app — em vez de
// cada requisição chamar getSession() por conta própria. Logo após um
// reload da SPA, o SDK ainda está reidratando a sessão a partir do
// localStorage; se o httpClient e o AuthProvider tivessem cada um sua
// própria assinatura de onAuthStateChange, nada garantiria que a do
// httpClient já tivesse resolvido no momento em que o AuthProvider libera a
// navegação — foi exatamente essa corrida que causava 401 falso logo após
// entrar. Ter uma única escrita, feita pelo mesmo efeito que libera
// ProtectedRoute, elimina a corrida por construção.
let currentAccessToken: string | null = null;

export function getCurrentAccessToken(): string | null {
  return currentAccessToken;
}

export function setCurrentAccessToken(token: string | null): void {
  currentAccessToken = token;
}
