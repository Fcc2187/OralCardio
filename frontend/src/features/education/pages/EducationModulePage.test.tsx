import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EducationModulePage } from "./EducationModulePage";
import * as educationApi from "../api/educationApi";
import type { EducationModule } from "../types";
import { educationModuleQueryKey } from "@/shared/api/queryKeys";

vi.mock("../api/educationApi");

const mockModule1: EducationModule = {
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
        body: "Bactérias da boca podem alcançar a corrente sanguínea.",
      },
    ],
  },
  is_started: true,
  is_completed: false,
  started_at: "2026-01-01T10:00:00Z",
  completed_at: null,
};

const mockModule2: EducationModule = {
  id: "mod-2",
  slug: "o-que-e-bacteremia",
  title: "O Que é Bacteremia?",
  description: "Como bactérias entram no sangue.",
  category: "bacteremia",
  estimated_minutes: 4,
  order_index: 2,
  thumbnail_url: null,
  content: {
    sections: [
      {
        type: "text",
        title: "Definição clínica",
        body: "Presença temporária de bactérias na circulação.",
      },
    ],
  },
  is_started: false,
  is_completed: false,
  started_at: null,
  completed_at: null,
};

const mockModulesList = [mockModule1, mockModule2];

function TestNavigation() {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate("/educacao/o-que-e-bacteremia")}>
      Abrir segundo módulo
    </button>
  );
}

function renderWithClient(slug = "conexao-boca-coracao") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const rendered = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/educacao/${slug}`]}>
        <Routes>
          <Route
            path="/educacao/:slug"
            element={
              <>
                <TestNavigation />
                <EducationModulePage />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

  return { ...rendered, queryClient };
}

describe("EducationModulePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(educationApi.startModule).mockImplementation(async (id) => {
      if (id === "mod-2") return mockModule2;
      return mockModule1;
    });
  });

  it("renderiza o cabeçalho, hero do módulo, conteúdo e player de vídeo", async () => {
    vi.mocked(educationApi.fetchModuleBySlug).mockResolvedValue(mockModule1);
    vi.mocked(educationApi.fetchModules).mockResolvedValue(mockModulesList);

    const { container } = renderWithClient();

    expect(await screen.findByRole("heading", { level: 1, name: "Educação" })).toBeInTheDocument();
    expect(screen.getByText("A Conexão Entre Boca e Coração")).toBeInTheDocument();
    expect(screen.getByText("Por que isso importa?")).toBeInTheDocument();
    expect(screen.getByText("Vídeo instrutivo")).toBeInTheDocument();

    const video = container.querySelector("video");
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute("src", "/videos/video-1.mp4");
  });

  it("conclui automaticamente o módulo ao emitir ended no vídeo", async () => {
    vi.mocked(educationApi.fetchModuleBySlug).mockResolvedValue(mockModule1);
    vi.mocked(educationApi.fetchModules).mockResolvedValue(mockModulesList);
    vi.mocked(educationApi.completeModule).mockResolvedValue({
      ...mockModule1,
      is_completed: true,
      completed_at: "2026-01-01T10:05:00Z",
    });

    const { container } = renderWithClient();

    expect(await screen.findByText("A Conexão Entre Boca e Coração")).toBeInTheDocument();

    const video = container.querySelector("video");
    expect(video).toBeInTheDocument();

    if (video) {
      fireEvent.ended(video);
    }

    await waitFor(() => {
      expect(educationApi.completeModule).toHaveBeenCalledOnce();
    });

    expect(await screen.findByText("Vídeo concluído — módulo concluído!")).toBeInTheDocument();
    expect(await screen.findByText("Módulo concluído!")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ver próximos/i })).toHaveAttribute(
      "href",
      "/educacao/o-que-e-bacteremia",
    );
  });

  it("conclui o primeiro módulo, navega por 'Ver próximos' e exibe corretamente o segundo módulo", async () => {
    vi.mocked(educationApi.fetchModuleBySlug).mockImplementation(async (slug) => {
      if (slug === "conexao-boca-coracao") return mockModule1;
      if (slug === "o-que-e-bacteremia") return mockModule2;
      throw new Error("Not found");
    });
    vi.mocked(educationApi.fetchModules).mockResolvedValue(mockModulesList);
    vi.mocked(educationApi.completeModule).mockResolvedValue({
      ...mockModule1,
      is_completed: true,
      completed_at: "2026-01-01T10:05:00Z",
    });

    const { container } = renderWithClient("conexao-boca-coracao");

    expect(await screen.findByText("A Conexão Entre Boca e Coração")).toBeInTheDocument();

    const video = container.querySelector("video");
    if (video) {
      fireEvent.ended(video);
    }

    const nextLink = await screen.findByRole("link", { name: /Ver próximos/i });
    expect(nextLink).toHaveAttribute("href", "/educacao/o-que-e-bacteremia");
    fireEvent.click(nextLink, { button: 0 });

    // Aguarda transição para o segundo módulo
    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 2, name: "O Que é Bacteremia?" })).toBeInTheDocument();
    });
    expect(screen.getByText("Definição clínica")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: "A Conexão Entre Boca e Coração" })).not.toBeInTheDocument();
    expect(screen.queryByText("Vídeo concluído — módulo concluído!")).not.toBeInTheDocument();
  });

  it("não conclui novamente se o módulo já estiver concluído", async () => {
    vi.mocked(educationApi.fetchModuleBySlug).mockResolvedValue({
      ...mockModule1,
      is_completed: true,
    });
    vi.mocked(educationApi.fetchModules).mockResolvedValue(mockModulesList);

    const { container } = renderWithClient();

    expect(await screen.findByText("A Conexão Entre Boca e Coração")).toBeInTheDocument();

    const video = container.querySelector("video");
    if (video) {
      fireEvent.ended(video);
    }

    expect(educationApi.completeModule).not.toHaveBeenCalled();
  });

  it("envia uma única conclusão para eventos ended síncronos", async () => {
    vi.mocked(educationApi.fetchModuleBySlug).mockResolvedValue(mockModule1);
    vi.mocked(educationApi.fetchModules).mockResolvedValue(mockModulesList);
    vi.mocked(educationApi.completeModule).mockResolvedValue({
      ...mockModule1,
      is_completed: true,
      completed_at: "2026-01-01T10:05:00Z",
    });

    const { container } = renderWithClient();
    expect(await screen.findByText("A Conexão Entre Boca e Coração")).toBeInTheDocument();

    const video = container.querySelector("video");
    if (video) {
      fireEvent.ended(video);
      fireEvent.ended(video);
      fireEvent.ended(video);
    }

    await waitFor(() => {
      expect(educationApi.completeModule).toHaveBeenCalledOnce();
    });
  });

  it("mantém o cache do módulo atual quando a conclusão anterior termina após a navegação", async () => {
    let resolveCompletion!: (value: EducationModule) => void;
    let secondModuleFetches = 0;

    vi.mocked(educationApi.fetchModuleBySlug).mockImplementation(async (slug) => {
      if (slug === mockModule1.slug) return mockModule1;
      secondModuleFetches += 1;
      if (secondModuleFetches === 1) return mockModule2;
      return new Promise<EducationModule>(() => undefined);
    });
    vi.mocked(educationApi.fetchModules).mockResolvedValue(mockModulesList);
    vi.mocked(educationApi.completeModule).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCompletion = resolve;
        }),
    );

    const { container, queryClient } = renderWithClient();
    expect(await screen.findByText(mockModule1.title)).toBeInTheDocument();

    const video = container.querySelector("video");
    if (video) fireEvent.ended(video);
    await waitFor(() => expect(educationApi.completeModule).toHaveBeenCalledOnce());

    fireEvent.click(screen.getByRole("button", { name: "Abrir segundo módulo" }));
    expect(await screen.findByText(mockModule2.title)).toBeInTheDocument();

    await act(async () => {
      resolveCompletion({
        ...mockModule1,
        is_completed: true,
        completed_at: "2026-01-01T10:05:00Z",
      });
    });

    await waitFor(() => {
      expect(queryClient.getQueryData<EducationModule>(educationModuleQueryKey(mockModule1.slug)))
        .toMatchObject({ slug: mockModule1.slug, is_completed: true });
    });
    expect(queryClient.getQueryData<EducationModule>(educationModuleQueryKey(mockModule2.slug)))
      .toMatchObject({ slug: mockModule2.slug, is_completed: false });
    expect(secondModuleFetches).toBe(1);
    expect(screen.queryByText("Vídeo concluído — módulo concluído!")).not.toBeInTheDocument();
  });

  it("exibe mensagem 'Vídeo em breve' para o sexto módulo sem vídeo", async () => {
    const mockModule6: EducationModule = {
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
    };

    vi.mocked(educationApi.startModule).mockResolvedValue(mockModule6);
    vi.mocked(educationApi.fetchModuleBySlug).mockResolvedValue(mockModule6);
    vi.mocked(educationApi.fetchModules).mockResolvedValue([...mockModulesList, mockModule6]);

    renderWithClient("medicamentos-cardiacos-odontologia");

    expect(await screen.findByText("Medicamentos Cardíacos e a Odontologia")).toBeInTheDocument();
    expect(screen.getByText("Vídeo instrutivo em breve.")).toBeInTheDocument();
    expect(educationApi.completeModule).not.toHaveBeenCalled();
  });
});
