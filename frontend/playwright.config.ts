import { defineConfig, devices } from "@playwright/test";

const port = 4173;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 5"] } },
  ],
  webServer: {
    // Invoca o binário diretamente para que o Playwright consiga encerrar o
    // servidor também no Windows (npm.cmd pode deixar o filho Vite órfão).
    command: `node ./node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port ${port}`,
    url: baseURL,
    // Evita reutilizar um preview órfão e garante que o runner possa encerrar
    // o processo filho ao fim da suíte, inclusive no Windows.
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
