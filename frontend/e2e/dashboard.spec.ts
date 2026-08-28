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

const MOCK_DASHBOARD = {
  full_name: "Felipe Silva",
  brushings_today: 0,
  flossings_today: 0,
  current_streak_days: 0,
  total_points: 2100,
  level: 4,
  level_name: "Flor",
  current_level_min_points: 1875,
  next_level_name: "Fruto",
  next_level_min_points: 3750,
  completed_education_modules: 3,
  total_education_modules: 6,
  next_appointment_at: "2026-10-15T14:30:00Z",
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/dashboard", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_DASHBOARD),
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

test("Home renderiza saudação, cards e não possui violações críticas de acessibilidade", async ({
  page,
}, testInfo) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Olá, Felipe" })).toBeVisible();
  await expect(page.getByText("Ainda não escovou")).toBeVisible();
  await expect(page.getByText("Já usou fio dental hoje?")).toBeVisible();
  await expect(page.getByText("Flor")).toBeVisible();
  await expect(page.getByText("2100 / 3750 pontos")).toBeVisible();
  await expect(page.getByRole("link", { name: "Configurar notificações" })).toBeVisible();

  if (testInfo.project.name === "mobile-chrome") {
    await expect(page.locator("nav[aria-label='Navegação principal']")).toBeVisible();
  } else {
    await expect(page.locator("aside[aria-label='Navegação principal']")).toBeVisible();
  }

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
});
