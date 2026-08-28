import { fileURLToPath, URL } from "node:url";

import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    exclude: [...configDefaults.exclude, "e2e/**"],
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // Fixa um fuso não-UTC nos testes: com TZ=UTC (padrão de CI), uma
    // implementação errada de conversão data-local<->ISO passaria em todas
    // as asserções sem revelar o bug (ver src/shared/utils/dateTimeLocal.ts).
    env: {
      TZ: "America/Sao_Paulo",
      VITE_SUPABASE_URL: "https://mock.supabase.co",
      VITE_SUPABASE_ANON_KEY: "mock-anon-key",
      VITE_API_BASE_URL: "https://mock.api.dev",
    },
  },
});
