import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("a tela de entrada é navegável e não possui violações a11y críticas", async ({ page }) => {
  await page.goto("/entrar");

  await expect(page.getByRole("heading", { name: "Bem-vindo(a)! 👋" })).toBeVisible();
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Senha", exact: true })).toBeVisible();

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
});

test("a senha pode ser exibida sem perder seu rótulo acessível", async ({ page }) => {
  await page.goto("/entrar");

  const password = page.getByRole("textbox", { name: "Senha", exact: true });
  await password.fill("segredo");
  await page.getByRole("button", { name: "Mostrar senha" }).click();

  await expect(password).toHaveAttribute("type", "text");
  await expect(page.getByRole("button", { name: "Ocultar senha" })).toBeVisible();
});

test("a recuperação solicita um link sem revelar se a conta existe", async ({ page }) => {
  await page.route("**/auth/v1/recover**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    expect(url.searchParams.get("redirect_to")).toBe(
      "http://127.0.0.1:4173/redefinir-senha",
    );
    expect(request.postDataJSON().email).toBe("ana@example.com");
    await route.fulfill({ contentType: "application/json", body: "{}" });
  });

  await page.goto("/esqueci-senha");
  await page.getByLabel("E-mail").fill("ana@example.com");
  await page.getByRole("button", { name: "Enviar instruções" }).click();

  await expect(
    page.getByText(
      "Se existir uma conta para este e-mail, enviaremos as instruções de recuperação.",
    ),
  ).toBeVisible();
});

test("as telas de recuperação não possuem violações a11y", async ({ page }) => {
  await page.goto("/esqueci-senha");
  await expect(page.getByRole("heading", { name: "Recuperar senha" })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.goto("/redefinir-senha");
  await expect(page.getByRole("heading", { name: "Link inválido" })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("o cadastro preserva os quatro campos e o retorno para entrar", async ({ page }, testInfo) => {
  await page.goto("/criar-conta");

  const backLink = page.getByRole("link", { name: /Voltar/ });
  if (testInfo.project.name === "mobile-chrome") {
    await expect(backLink).toHaveAttribute("href", "/entrar");
  } else {
    await expect(backLink).toBeHidden();
  }
  await expect(page.getByLabel("Nome completo")).toBeVisible();
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Senha", exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Confirmar senha" })).toBeVisible();
});

test("o cadastro com resposta mockada mostra a confirmação de e-mail", async ({ page }) => {
  await page.route("**/auth/v1/signup", async (route) => {
    const request = route.request().postDataJSON();
    expect(request.email).toBe("ana@example.com");
    expect(request.data.full_name).toBe("Ana Silva");
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        user: { id: "test-user", aud: "authenticated", role: "authenticated", email: request.email },
        session: null,
      }),
    });
  });

  await page.goto("/criar-conta");
  await page.getByLabel("Nome completo").fill("Ana Silva");
  await page.getByLabel("E-mail").fill("ana@example.com");
  await page.getByRole("textbox", { name: "Senha", exact: true }).fill("AnaSenha!2026");
  await page.getByRole("textbox", { name: "Confirmar senha" }).fill("AnaSenha!2026");
  await page.getByRole("button", { name: "Criar conta" }).click();

  await expect(page.getByRole("heading", { name: "Quase lá" })).toBeVisible();
  await expect(page.getByText("ana@example.com")).toBeVisible();
});

test("uma rota da PWA pode ser aberta diretamente", async ({ page }) => {
  await page.goto("/agenda");
  await expect(page).toHaveURL(/\/entrar$/);
});
