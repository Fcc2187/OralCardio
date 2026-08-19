const requiredKeys = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", "VITE_API_BASE_URL"];
const missing = requiredKeys.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`Variáveis ausentes: ${missing.join(", ")}`);
  process.exit(1);
}

function parseUrl(name) {
  try {
    return new URL(process.env[name]);
  } catch {
    console.error(`${name} precisa ser uma URL válida.`);
    process.exit(1);
  }
}

const supabaseUrl = parseUrl("VITE_SUPABASE_URL");
const apiUrl = parseUrl("VITE_API_BASE_URL");
const forbiddenHosts = new Set(["localhost", "127.0.0.1", "::1"]);

for (const [name, url] of [["VITE_SUPABASE_URL", supabaseUrl], ["VITE_API_BASE_URL", apiUrl]]) {
  if (url.protocol !== "https:" || forbiddenHosts.has(url.hostname) || url.username || url.password) {
    console.error(`${name} deve usar HTTPS público, sem credenciais na URL.`);
    process.exit(1);
  }
}

if (!supabaseUrl.hostname.endsWith(".supabase.co")) {
  console.error("VITE_SUPABASE_URL deve apontar para o domínio público do Supabase.");
  process.exit(1);
}
