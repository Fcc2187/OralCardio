import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const MOCK_USER = {
  id: "test-user-id",
  aud: "authenticated",
  role: "authenticated",
  email: "felipe@example.com",
};

const MOCK_SESSION = {
  access_token: "mock-access-token",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 86400,
  refresh_token: "mock-refresh-token",
  user: MOCK_USER,
};

const MOCK_BRUSHING_SESSION = {
  id: "session-123",
  user_id: "test-user-id",
  started_at: new Date().toISOString(),
  completed_at: null,
  duration_seconds: null,
  target_duration: 120,
  zones_completed: [],
  is_completed: false,
  technique_tip_shown: null,
  notes: null,
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/brushing-sessions", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_BRUSHING_SESSION),
    });
  });

  await page.route("**/api/v1/brushing-sessions/*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_BRUSHING_SESSION),
    });
  });

  await page.route("**/api/v1/health-profile", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ is_completed: true }),
    });
  });

  await page.route("**/auth/v1/user", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_USER),
    });
  });

  await page.addInitScript((session) => {
    const sessionStr = JSON.stringify(session);
    const originalGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = function (key: string) {
      if (typeof key === "string" && key.startsWith("sb-") && key.endsWith("-auth-token")) {
        return sessionStr;
      }
      return originalGetItem.apply(this, [key]);
    };
    window.localStorage.setItem("sb-ci-placeholder-auth-token", sessionStr);
    window.localStorage.setItem("sb-your-project-auth-token", sessionStr);
  }, MOCK_SESSION);
});

test("página de escovação renderiza o estado inicial e inicia a sessão com acessibilidade", async ({ page }) => {
  await page.goto("/escovar");

  await expect(page.getByRole("heading", { name: "Hora de escovar" })).toBeVisible();
  await expect(page.getByText("2 minutos, 5 zonas da boca")).toBeVisible();

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);

  await page.getByRole("button", { name: "Começar" }).click();

  await expect(page.getByRole("heading", { name: "Escovando" })).toBeVisible();
  await expect(page.getByText("Tempo total")).toBeVisible();
  await expect(page.getByText("2:00")).toBeVisible();
  await expect(page.getByText("Superior direito", { exact: true })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Progresso da escovação" })).toBeVisible();

  // Abre e fecha o modal de dicas
  await page.getByRole("button", { name: "Dicas" }).click();
  await expect(page.getByRole("dialog", { name: "Dicas de Escovação" })).toBeVisible();
  await page.getByRole("button", { name: "Entendi" }).click();
  await expect(page.getByRole("dialog", { name: "Dicas de Escovação" })).toBeHidden();
});
