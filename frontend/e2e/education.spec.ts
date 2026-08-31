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

const MOCK_MODULES = [
  {
    id: "mod-1",
    slug: "conexao-boca-coracao",
    title: "A Conexão Entre Boca e Coração",
    description: "Entenda por que a saúde bucal é tão importante para quem tem uma condição cardíaca.",
    category: "mouth_heart_connection",
    estimated_minutes: 5,
    order_index: 1,
    thumbnail_url: null,
    content: {
      sections: [
        {
          type: "text",
          title: "Por que isso importa?",
          body: "Bactérias da boca podem alcançar a corrente sanguínea e afetar o coração.",
        },
      ],
    },
    is_started: false,
    is_completed: false,
    started_at: null,
    completed_at: null,
  },
  {
    id: "mod-2",
    slug: "o-que-e-bacteremia",
    title: "O Que é Bacteremia?",
    description: "Como bactérias orais entram na corrente sanguínea.",
    category: "bacteremia",
    estimated_minutes: 4,
    order_index: 2,
    thumbnail_url: null,
    content: {
      sections: [
        {
          type: "text",
          title: "Definição clínica",
          body: "Bacteremia é a presença transitória de bactérias no sangue.",
        },
      ],
    },
    is_started: false,
    is_completed: false,
    started_at: null,
    completed_at: null,
  },
  {
    id: "mod-6",
    slug: "medicamentos-cardiacos-odontologia",
    title: "Medicamentos Cardíacos e a Odontologia",
    description: "Segurança nos procedimentos odontológicos.",
    category: "medication_interactions",
    estimated_minutes: 6,
    order_index: 6,
    thumbnail_url: null,
    content: { sections: [] },
    is_started: false,
    is_completed: false,
    started_at: null,
    completed_at: null,
  },
];

test.beforeEach(async ({ page }) => {
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

  await page.route("**/api/v1/education/**", async (route) => {
    const url = route.request().url();

    if (url.includes("/start")) {
      const parts = url.split("/");
      const id = parts[parts.length - 2];
      const mod = MOCK_MODULES.find((m) => m.id === id || m.slug === id) ?? MOCK_MODULES[0];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...mod,
          is_started: true,
          started_at: new Date().toISOString(),
        }),
      });
      return;
    }

    if (url.includes("/complete")) {
      const parts = url.split("/");
      const id = parts[parts.length - 2];
      const mod = MOCK_MODULES.find((m) => m.id === id || m.slug === id) ?? MOCK_MODULES[0];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...mod,
          is_started: true,
          is_completed: true,
          completed_at: new Date().toISOString(),
        }),
      });
      return;
    }

    if (url.endsWith("/api/v1/education/modules") || url.includes("/api/v1/education/modules?")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_MODULES),
      });
      return;
    }

    const slug = url.split("/api/v1/education/modules/")[1]?.split("?")[0];
    const found = MOCK_MODULES.find((m) => m.slug === slug || m.id === slug);
    if (found) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(found),
      });
    } else {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Not found" }),
      });
    }
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

test("Listagem de educação renderiza resumo, cards e passa no Axe-core", async ({ page }) => {
  await page.goto("/educacao");

  await expect(page.getByRole("heading", { level: 1, name: "Educação" })).toBeVisible();
  await expect(page.getByText("0 de 3 concluídos")).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Progresso nos módulos educativos" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Módulos disponíveis" })).toBeVisible();
  await expect(page.getByText("A Conexão Entre Boca e Coração")).toBeVisible();
  await expect(page.getByText("O Que é Bacteremia?")).toBeVisible();

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
});

test("Listagem não possui overflow horizontal em telas estreitas de 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/educacao");

  await expect(page.getByRole("heading", { level: 1, name: "Educação" })).toBeVisible();

  const hasHorizontalScrollbar = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  expect(hasHorizontalScrollbar).toBe(false);
});

test("Página de módulo conclui no evento ended, exibe toast e navega para o próximo módulo", async ({ page }) => {
  await page.goto("/educacao/conexao-boca-coracao");

  await expect(page.getByRole("heading", { level: 1, name: "Educação" })).toBeVisible();
  await expect(page.getByText("Módulo 1")).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "A Conexão Entre Boca e Coração" })).toBeVisible();
  await expect(page.getByText("Por que isso importa?")).toBeVisible();

  // Simula término do vídeo
  await page.locator("video").dispatchEvent("ended");

  // Verifica toast de conclusão e card de continuidade
  await expect(page.getByText("Vídeo concluído — módulo concluído!")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Módulo concluído!" })).toBeVisible();

  const nextLink = page.getByRole("link", { name: "Ver próximos" });
  await expect(nextLink).toBeVisible();

  // Navega para o próximo módulo
  await nextLink.click();

  // Confirma que a nova página carregou o segundo módulo corretamente
  await expect(page).toHaveURL("/educacao/o-que-e-bacteremia");
  await expect(page.getByRole("heading", { level: 2, name: "O Que é Bacteremia?" })).toBeVisible();
  await expect(page.getByText("Definição clínica")).toBeVisible();
  await expect(page.getByText("Módulo 2")).toBeVisible();

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
});

test("Eventos ended duplicados disparam requisição de conclusão apenas uma vez", async ({ page }) => {
  let completeCalls = 0;
  await page.route("**/api/v1/education/modules/*/complete", async (route) => {
    completeCalls += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ...MOCK_MODULES[0],
        is_started: true,
        is_completed: true,
        completed_at: new Date().toISOString(),
      }),
    });
  });

  await page.goto("/educacao/conexao-boca-coracao");
  await expect(page.getByRole("heading", { level: 2, name: "A Conexão Entre Boca e Coração" })).toBeVisible();

  // Dispara múltiplos eventos ended rapidamente
  await page.locator("video").dispatchEvent("ended");
  await page.locator("video").dispatchEvent("ended");
  await page.locator("video").dispatchEvent("ended");

  await expect(page.getByRole("heading", { name: "Módulo concluído!" })).toBeVisible();
  expect(completeCalls).toBe(1);
});

test("Exibe feedback de erro e permite tentar novamente se complete falhar", async ({ page }) => {
  let hasFailedOnce = false;

  await page.route("**/api/v1/education/modules/*/complete", async (route) => {
    if (!hasFailedOnce) {
      hasFailedOnce = true;
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Internal Server Error" }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...MOCK_MODULES[0],
          is_started: true,
          is_completed: true,
          completed_at: new Date().toISOString(),
        }),
      });
    }
  });

  await page.goto("/educacao/conexao-boca-coracao");
  await expect(page.getByRole("heading", { level: 2, name: "A Conexão Entre Boca e Coração" })).toBeVisible();

  // Dispara término do vídeo
  await page.locator("video").dispatchEvent("ended");

  // Deve exibir mensagem de erro e botão Tentar novamente
  await expect(page.getByText("Não foi possível salvar sua conclusão. Tente novamente.")).toBeVisible();
  const retryBtn = page.getByRole("button", { name: "Tentar novamente" });
  await expect(retryBtn).toBeVisible();

  // Clica para tentar novamente
  await retryBtn.click();

  // Agora conclui com sucesso
  await expect(page.getByRole("heading", { name: "Módulo concluído!" })).toBeVisible();
});

test("Sexto módulo exibe 'Vídeo instrutivo em breve.'", async ({ page }) => {
  await page.goto("/educacao/medicamentos-cardiacos-odontologia");

  await expect(page.getByRole("heading", { level: 2, name: "Medicamentos Cardíacos e a Odontologia" })).toBeVisible();
  await expect(page.getByText("Vídeo instrutivo em breve.")).toBeVisible();
});
