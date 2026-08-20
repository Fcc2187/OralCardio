import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("a tela de entrada é navegável e não possui violações a11y críticas", async ({ page }) => {
  await page.goto("/entrar");

  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(page.getByLabel("Senha")).toBeVisible();

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
});

test("uma rota da PWA pode ser aberta diretamente", async ({ page }) => {
  await page.goto("/agenda");
  await expect(page).toHaveURL(/\/entrar$/);
});
