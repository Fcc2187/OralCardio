import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DashboardPage } from "./DashboardPage";

const useDashboardQuery = vi.hoisted(() => vi.fn());
vi.mock("../api/useDashboardQuery", () => ({ useDashboardQuery }));

const useNotifications = vi.hoisted(() => vi.fn());
vi.mock("@/features/notifications/notificationContext", () => ({ useNotifications }));

const SUMMARY_V2 = {
  full_name: "Maria Silva",
  brushings_today: 2,
  flossings_today: 3,
  current_streak_days: 4,
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

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  useNotifications.mockReturnValue({
    permission: "granted",
    hasSubscription: true,
    isBusy: false,
    error: null,
    refresh: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
  });
});

describe("DashboardPage", () => {
  it("mostra saudação, contadores diários e permite repetir os hábitos", () => {
    useDashboardQuery.mockReturnValue({ data: SUMMARY_V2, isPending: false, isError: false });
    render(<DashboardPage />, { wrapper });

    expect(screen.getByRole("heading", { name: "Olá, Maria" })).toBeInTheDocument();
    expect(screen.getByText("2 escovações hoje")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Escovar novamente/ })).toBeInTheDocument();
    expect(screen.getByText("3 usos de fio dental hoje ✓")).toBeInTheDocument();
    expect(screen.getByText("4 dias seguidos")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Configurar notificações" })).toBeInTheDocument();
  });

  it("mantém o primeiro chamado quando ainda não há registros de escovação", () => {
    useDashboardQuery.mockReturnValue({
      data: { ...SUMMARY_V2, brushings_today: 0, flossings_today: 0 },
      isPending: false,
      isError: false,
    });
    render(<DashboardPage />, { wrapper });

    expect(screen.getByText("Ainda não escovou")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Escovar agora/ })).toBeInTheDocument();
  });

  it("renderiza o card de nível com progresso dinâmico e imagem botânica", () => {
    useDashboardQuery.mockReturnValue({
      data: SUMMARY_V2,
      isPending: false,
      isError: false,
    });
    const { container } = render(<DashboardPage />, { wrapper });

    expect(screen.getByText("Flor")).toBeInTheDocument();
    expect(screen.getByText("2100 pontos")).toBeInTheDocument();
    expect(screen.getByText("2100 / 3750 pontos")).toBeInTheDocument();
    expect(container.querySelector('img[src="/images/levels/flor.webp"]')).toBeInTheDocument();
  });

  it("apresenta estado de nível máximo (100% de progresso)", () => {
    useDashboardQuery.mockReturnValue({
      data: {
        ...SUMMARY_V2,
        total_points: 8200,
        level: 6,
        level_name: "Guardião do Coração",
        current_level_min_points: 7500,
        next_level_name: null,
        next_level_min_points: null,
      },
      isPending: false,
      isError: false,
    });
    render(<DashboardPage />, { wrapper });

    expect(screen.getByText("Guardião do Coração")).toBeInTheDocument();
    expect(screen.getByText("Nível máximo atingido")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });

  it("renderiza atalhos rápidos de Educação, Agenda e Conquistas", () => {
    useDashboardQuery.mockReturnValue({ data: SUMMARY_V2, isPending: false, isError: false });
    render(<DashboardPage />, { wrapper });

    expect(screen.getByText("3 de 6 concluídos")).toBeInTheDocument();
    expect(screen.getByText(/Consulta:/)).toBeInTheDocument();
    expect(screen.getByText("Veja suas conquistas")).toBeInTheDocument();
  });
});
