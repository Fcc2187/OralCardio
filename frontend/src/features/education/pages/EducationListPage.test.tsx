import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EducationListPage } from "./EducationListPage";
import * as educationApi from "../api/educationApi";
import type { EducationModule } from "../types";

vi.mock("../api/educationApi");

const mockModules: EducationModule[] = [
  {
    id: "mod-1",
    slug: "conexao-boca-coracao",
    title: "A Conexão Entre Boca e Coração",
    description: "Entenda por que a saúde bucal é importante.",
    category: "mouth_heart_connection",
    estimated_minutes: 5,
    order_index: 1,
    thumbnail_url: null,
    content: [],
    is_started: true,
    is_completed: true,
    started_at: "2026-01-01T10:00:00Z",
    completed_at: "2026-01-01T10:05:00Z",
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
    content: [],
    is_started: true,
    is_completed: false,
    started_at: "2026-01-01T10:00:00Z",
    completed_at: null,
  },
  {
    id: "mod-3",
    slug: "entendendo-endocardite",
    title: "Entendendo a Endocardite Infecciosa",
    description: "O que é e como acontece.",
    category: "endocarditis",
    estimated_minutes: 6,
    order_index: 3,
    thumbnail_url: null,
    content: [],
    is_started: false,
    is_completed: false,
    started_at: null,
    completed_at: null,
  },
];

function renderWithClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <EducationListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("EducationListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza o cabeçalho, resumo de progresso e a lista de módulos na ordem correta", async () => {
    vi.mocked(educationApi.fetchModules).mockResolvedValueOnce(mockModules);

    renderWithClient();

    expect(await screen.findByRole("heading", { level: 1, name: "Educação" })).toBeInTheDocument();
    expect(screen.getByText("1 de 3 concluídos")).toBeInTheDocument();

    expect(screen.getByRole("progressbar", { name: "Progresso nos módulos educativos" })).toBeInTheDocument();
    expect(screen.getByText("33%")).toBeInTheDocument();

    expect(screen.getByRole("heading", { level: 2, name: "Módulos disponíveis" })).toBeInTheDocument();

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveAttribute("href", "/educacao/conexao-boca-coracao");
    expect(links[1]).toHaveAttribute("href", "/educacao/o-que-e-bacteremia");
    expect(links[2]).toHaveAttribute("href", "/educacao/entendendo-endocardite");

    expect(screen.queryByText(/bloqueado/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/mais recentes/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/seu progresso/i)).not.toBeInTheDocument();
  });

  it("renderiza mensagem amigável quando a lista de módulos estiver vazia", async () => {
    vi.mocked(educationApi.fetchModules).mockResolvedValueOnce([]);

    renderWithClient();

    expect(await screen.findByRole("heading", { level: 1, name: "Educação" })).toBeInTheDocument();
    expect(screen.getByText("0 de 0 concluídos")).toBeInTheDocument();
    expect(screen.getByText("Nenhum módulo educativo disponível no momento.")).toBeInTheDocument();
  });

  it("renderiza feedback de erro quando a requisição falha", async () => {
    vi.mocked(educationApi.fetchModules).mockRejectedValueOnce(new Error("Network Error"));

    renderWithClient();

    expect(await screen.findByText(/Não foi possível carregar os módulos/i)).toBeInTheDocument();
  });
});
