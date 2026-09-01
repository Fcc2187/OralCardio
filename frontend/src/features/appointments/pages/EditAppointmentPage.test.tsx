import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EditAppointmentPage } from "./EditAppointmentPage";
import type { Appointment } from "../types";

const useAppointmentQuery = vi.hoisted(() => vi.fn());
vi.mock("../api/useAppointmentQueries", () => ({ useAppointmentQuery }));

const patchAppointment = vi.hoisted(() => vi.fn());
vi.mock("../api/appointmentsApi", () => ({ patchAppointment }));

const MOCK_APPOINTMENT: Appointment = {
  id: "apt-1",
  user_id: "usr-1",
  dentist_name: "doutor pedro",
  clinic_name: "clinica amaraji",
  clinic_address: "rua amaraji 80",
  clinic_phone: "81999554108",
  appointment_type: "routine_checkup",
  scheduled_at: "2026-10-12T18:00:00Z",
  status: "scheduled",
  notes: "Trazer exames",
  created_at: "2026-09-01T10:00:00Z",
  updated_at: "2026-09-01T10:00:00Z",
};

function renderWithRouter(initialEntry = "/agenda/apt-1/editar") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/agenda/:id/editar" element={<EditAppointmentPage />} />
          <Route path="/agenda/:id" element={<div>Consulta Detail</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useAppointmentQuery.mockReturnValue({
    data: MOCK_APPOINTMENT,
    isPending: false,
    isError: false,
  });
  patchAppointment.mockResolvedValue(MOCK_APPOINTMENT);
});
describe("EditAppointmentPage", () => {
  it("renderiza cabeçalho, link de retorno, formulário preenchido e botão de salvar alterações", () => {
    renderWithRouter();

    // Link para voltar ao detalhe da consulta
    expect(screen.getByRole("link", { name: /Consulta/i })).toHaveAttribute("href", "/agenda/apt-1");

    // Cabeçalho e subtítulo
    expect(screen.getByRole("heading", { name: "Editar consulta", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Edite as informações da sua consulta.")).toBeInTheDocument();

    // Valores pré-preenchidos
    expect(screen.getByDisplayValue("doutor pedro")).toBeInTheDocument();
    expect(screen.getByDisplayValue("clinica amaraji")).toBeInTheDocument();
    expect(screen.getByDisplayValue("rua amaraji 80")).toBeInTheDocument();
    expect(screen.getByDisplayValue("81999554108")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Trazer exames")).toBeInTheDocument();

    // Botão de submissão
    expect(screen.getByRole("button", { name: /Salvar alterações/i })).toBeInTheDocument();
  });
});
