import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NewAppointmentPage } from "./NewAppointmentPage";

const createAppointment = vi.hoisted(() => vi.fn());
vi.mock("../api/appointmentsApi", () => ({ createAppointment }));

function renderWithRouter() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/agenda/nova"]}>
        <Routes>
          <Route path="/agenda/nova" element={<NewAppointmentPage />} />
          <Route path="/agenda" element={<div>Agenda List</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  createAppointment.mockResolvedValue({ id: "apt-new" });
});

describe("NewAppointmentPage", () => {
  it("renderiza cabeçalho, link de retorno, campos com ícones e botão de agendar", () => {
    renderWithRouter();

    // Link para voltar
    expect(screen.getByRole("link", { name: /Agenda/i })).toHaveAttribute("href", "/agenda");

    // Cabeçalho e subtítulo
    expect(screen.getByRole("heading", { name: "Nova consulta", level: 1 })).toBeInTheDocument();
    expect(
      screen.getByText("Preencha as informações abaixo para agendar sua consulta."),
    ).toBeInTheDocument();

    // Campos do formulário
    expect(screen.getByLabelText(/Data e hora \(Brasília\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tipo de consulta/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome do dentista/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome da clínica \(opcional\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Endereço da clínica \(opcional\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Telefone da clínica \(opcional\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Notas \(opcional\)/i)).toBeInTheDocument();

    // Botão de submissão
    expect(screen.getByRole("button", { name: /Agendar/i })).toBeInTheDocument();
  });
});
