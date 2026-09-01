import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppointmentsListPage } from "./AppointmentsListPage";
import type { Appointment } from "../types";

const useAppointmentsInfiniteQuery = vi.hoisted(() => vi.fn());
vi.mock("../api/useAppointmentQueries", () => ({ useAppointmentsInfiniteQuery }));

const useCurrentTime = vi.hoisted(() => vi.fn());
vi.mock("@/shared/hooks/useCurrentTime", () => ({ useCurrentTime }));

const NOW_TS = new Date("2026-09-01T12:00:00Z").getTime();

const MOCK_ITEMS: Appointment[] = [
  {
    id: "apt-upcoming",
    user_id: "usr-1",
    dentist_name: "Dra. Ana",
    clinic_name: "Clínica Vida",
    clinic_address: "Av. Principal, 100",
    clinic_phone: "81988887777",
    appointment_type: "routine_checkup",
    scheduled_at: "2026-10-12T18:00:00Z", // Futura
    status: "scheduled",
    notes: null,
    created_at: "2026-09-01T10:00:00Z",
    updated_at: "2026-09-01T10:00:00Z",
  },
  {
    id: "apt-overdue",
    user_id: "usr-1",
    dentist_name: "Dr. Carlos",
    clinic_name: "Clínica Odonto",
    clinic_address: null,
    clinic_phone: null,
    appointment_type: "cleaning",
    scheduled_at: "2026-08-15T14:00:00Z", // Passada e ainda agendada -> Aguardando confirmação
    status: "scheduled",
    notes: null,
    created_at: "2026-08-01T10:00:00Z",
    updated_at: "2026-08-01T10:00:00Z",
  },
  {
    id: "apt-past",
    user_id: "usr-1",
    dentist_name: "Dr. Roberto",
    clinic_name: null,
    clinic_address: null,
    clinic_phone: null,
    appointment_type: "follow_up",
    scheduled_at: "2026-07-10T11:00:00Z", // Concluída -> Histórico
    status: "completed",
    notes: null,
    created_at: "2026-07-01T10:00:00Z",
    updated_at: "2026-07-10T12:00:00Z",
  },
];

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useCurrentTime.mockReturnValue(NOW_TS);
});

describe("AppointmentsListPage", () => {
  it("renderiza cabeçalho editorial, CTA Nova consulta e seções de consultas agrupadas", () => {
    useAppointmentsInfiniteQuery.mockReturnValue({
      data: { pages: [{ items: MOCK_ITEMS, nextCursor: null }] },
      isPending: false,
      isError: false,
      hasNextPage: false,
      fetchNextPage: vi.fn(),
      isFetchingNextPage: false,
    });

    render(<AppointmentsListPage />, { wrapper });

    // Cabeçalho editorial e título
    expect(screen.getByRole("heading", { name: "Agenda", level: 1 })).toBeInTheDocument();

    // CTA Nova consulta
    const cta = screen.getByRole("link", { name: /Nova consulta/ });
    expect(cta).toHaveAttribute("href", "/agenda/nova");

    // Seções
    expect(screen.getByRole("heading", { name: "Aguardando confirmação", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Próximas", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Histórico", level: 2 })).toBeInTheDocument();

    // Dentistas correspondentes
    expect(screen.getByText(/Dra. Ana/)).toBeInTheDocument();
    expect(screen.getByText(/Dr. Carlos/)).toBeInTheDocument();
    expect(screen.getByText(/Dr. Roberto/)).toBeInTheDocument();
  });

  it("renderiza estado vazio quando não há consultas", () => {
    useAppointmentsInfiniteQuery.mockReturnValue({
      data: { pages: [{ items: [], nextCursor: null }] },
      isPending: false,
      isError: false,
      hasNextPage: false,
      fetchNextPage: vi.fn(),
      isFetchingNextPage: false,
    });

    render(<AppointmentsListPage />, { wrapper });

    expect(screen.getByText("Nenhuma consulta agendada")).toBeInTheDocument();
    expect(
      screen.getByText("Agende sua próxima visita ao dentista para manter o acompanhamento em dia."),
    ).toBeInTheDocument();
  });

  it("renderiza estado de erro quando a query falha", () => {
    useAppointmentsInfiniteQuery.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      hasNextPage: false,
      fetchNextPage: vi.fn(),
      isFetchingNextPage: false,
    });

    render(<AppointmentsListPage />, { wrapper });

    expect(
      screen.getByText("Não foi possível carregar sua agenda. Tente novamente em instantes."),
    ).toBeInTheDocument();
  });

  it("renderiza botão 'Carregar mais' quando hasNextPage é true", () => {
    useAppointmentsInfiniteQuery.mockReturnValue({
      data: { pages: [{ items: MOCK_ITEMS, nextCursor: "page-2" }] },
      isPending: false,
      isError: false,
      hasNextPage: true,
      fetchNextPage: vi.fn(),
      isFetchingNextPage: false,
    });

    render(<AppointmentsListPage />, { wrapper });

    expect(screen.getByRole("button", { name: "Carregar mais" })).toBeInTheDocument();
  });
});
