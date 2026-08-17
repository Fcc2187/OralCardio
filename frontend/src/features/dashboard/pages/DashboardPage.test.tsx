import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { DashboardPage } from "./DashboardPage";

const useDashboardQuery = vi.hoisted(() => vi.fn());
vi.mock("../api/useDashboardQuery", () => ({ useDashboardQuery }));

const SUMMARY = {
  full_name: "Maria Silva",
  health_profile_completed: true,
  brushed_today: true,
  flossed_today: true,
  brushings_today: 2,
  flossings_today: 3,
  current_streak_days: 4,
  total_points: 50,
  level: 3,
  level_name: "Raiz",
};

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("DashboardPage", () => {
  it("mostra contadores diários e permite repetir os hábitos", () => {
    useDashboardQuery.mockReturnValue({ data: SUMMARY, isPending: false, isError: false });
    render(<DashboardPage />, { wrapper });

    expect(screen.getByText("2 escovações hoje")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Escovar novamente" })).toBeInTheDocument();
    expect(screen.getByText("3 usos de fio dental hoje ✓")).toBeInTheDocument();
  });

  it("mantém o primeiro chamado quando ainda não há registros", () => {
    useDashboardQuery.mockReturnValue({
      data: { ...SUMMARY, brushed_today: false, brushings_today: 0, flossings_today: 0 },
      isPending: false,
      isError: false,
    });
    render(<DashboardPage />, { wrapper });

    expect(screen.getByText("Ainda não escovou hoje")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Escovar agora" })).toBeInTheDocument();
  });
});
