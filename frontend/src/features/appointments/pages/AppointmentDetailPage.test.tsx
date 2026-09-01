import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HttpError } from "@/shared/api/httpClient";

import { AppointmentDetailPage } from "./AppointmentDetailPage";
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
  scheduled_at: "2026-10-12T18:00:00Z", // 15:00 no fuso de São Paulo
  status: "scheduled",
  notes: "Trazer exames anteriores",
  created_at: "2026-09-01T10:00:00Z",
  updated_at: "2026-09-01T10:00:00Z",
};

function renderWithRouter(initialEntry = "/agenda/apt-1") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/agenda/:id" element={<AppointmentDetailPage />} />
          <Route path="/agenda" element={<div>Agenda List</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  patchAppointment.mockResolvedValue({ ...MOCK_APPOINTMENT, status: "completed" });
});

describe("AppointmentDetailPage", () => {
  it("renderiza detalhes da consulta, badge, data formatada, clínica e botões de ação", () => {
    useAppointmentQuery.mockReturnValue({
      data: MOCK_APPOINTMENT,
      isPending: false,
      isError: false,
    });

    renderWithRouter();

    // Link de voltar para a Agenda
    expect(screen.getByRole("link", { name: /Agenda/i })).toHaveAttribute("href", "/agenda");

    // Título
    expect(screen.getByRole("heading", { name: "Consulta", level: 1 })).toBeInTheDocument();

    // Badge de status
    expect(screen.getByText("Agendada")).toBeInTheDocument();

    // Data e hora destacada
    expect(screen.getByText(/12 de outubro de 2026/)).toBeInTheDocument();
    expect(screen.getByText("15:00")).toBeInTheDocument();

    // Tipo e dentista
    expect(screen.getByText(/Exame de rotina · doutor pedro/)).toBeInTheDocument();

    // Clínica, endereço e telefone
    expect(screen.getByText("clinica amaraji")).toBeInTheDocument();
    expect(screen.getByText("rua amaraji 80")).toBeInTheDocument();
    const phoneLink = screen.getByRole("link", { name: "81999554108" });
    expect(phoneLink).toHaveAttribute("href", "tel:81999554108");

    // Notas
    expect(screen.getByText("Trazer exames anteriores")).toBeInTheDocument();

    // Botões de ação
    expect(screen.getByRole("link", { name: /Editar/ })).toHaveAttribute(
      "href",
      "/agenda/apt-1/editar",
    );
    expect(screen.getByRole("button", { name: /Marcar como concluída/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancelar consulta/ })).toBeInTheDocument();
  });

  it("permite confirmar e concluir a consulta", async () => {
    useAppointmentQuery.mockReturnValue({
      data: MOCK_APPOINTMENT,
      isPending: false,
      isError: false,
    });

    renderWithRouter();

    // Clica no botão inicial "Marcar como concluída"
    fireEvent.click(screen.getByRole("button", { name: /Marcar como concluída/ }));

    // Exibe pergunta de confirmação e botão "Sim"
    expect(
      screen.getByText("Tem certeza que deseja marcar como concluída?"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sim" }));

    await screen.findByRole("button", { name: /Marcar como concluída/ });
    expect(patchAppointment).toHaveBeenCalledWith("apt-1", { status: "completed" });
  });

  it("permite confirmar e cancelar a consulta", async () => {
    useAppointmentQuery.mockReturnValue({
      data: MOCK_APPOINTMENT,
      isPending: false,
      isError: false,
    });

    renderWithRouter();

    // Clica no botão inicial "Cancelar consulta"
    fireEvent.click(screen.getByRole("button", { name: /Cancelar consulta/ }));

    // Exibe pergunta de confirmação e botão "Sim"
    expect(screen.getByText("Tem certeza que deseja cancelar consulta?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sim" }));

    await screen.findByRole("button", { name: /Cancelar consulta/ });
    expect(patchAppointment).toHaveBeenCalledWith("apt-1", { status: "cancelled" });
  });

  it("não exibe botão de edição para consultas em estado terminal (ex: concluída)", () => {
    useAppointmentQuery.mockReturnValue({
      data: { ...MOCK_APPOINTMENT, status: "completed" },
      isPending: false,
      isError: false,
    });

    renderWithRouter();

    expect(screen.getByText("Concluída")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Editar/ })).not.toBeInTheDocument();
  });

  it("renderiza feedback de erro quando a consulta não é encontrada (404)", () => {
    useAppointmentQuery.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      error: new HttpError("Not Found", 404),
    });

    renderWithRouter();

    expect(screen.getByText("Consulta não encontrada.")).toBeInTheDocument();
  });
});
