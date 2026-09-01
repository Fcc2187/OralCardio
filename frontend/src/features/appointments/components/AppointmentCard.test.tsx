import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AppointmentCard } from "./AppointmentCard";
import type { Appointment } from "../types";

const MOCK_APPOINTMENT: Appointment = {
  id: "apt-1",
  user_id: "usr-1",
  dentist_name: "doutor pedro",
  clinic_name: "Clínica Sorriso",
  clinic_address: "Rua das Flores, 123",
  clinic_phone: "81999554108",
  appointment_type: "routine_checkup",
  scheduled_at: "2026-10-12T18:00:00Z", // 15:00 no fuso de São Paulo
  status: "scheduled",
  notes: null,
  created_at: "2026-09-01T10:00:00Z",
  updated_at: "2026-09-01T10:00:00Z",
};

describe("AppointmentCard", () => {
  it("renderiza consulta agendada com badge coral, data por extenso e hora destacada", () => {
    const nowMs = new Date("2026-09-01T12:00:00Z").getTime();

    render(
      <MemoryRouter>
        <AppointmentCard appointment={MOCK_APPOINTMENT} nowMs={nowMs} />
      </MemoryRouter>,
    );

    // Status badge
    expect(screen.getByText("Agendada")).toBeInTheDocument();

    // Relative day label
    expect(screen.getByText(/Em 41 dias|Em 42 dias/)).toBeInTheDocument();

    // Data e hora
    expect(screen.getByText(/12 de outubro de 2026/)).toBeInTheDocument();
    expect(screen.getByText("15:00")).toBeInTheDocument();

    // Tipo e dentista
    expect(screen.getByText(/Exame de rotina · doutor pedro/)).toBeInTheDocument();

    // Telefone clicável
    const phoneLink = screen.getByRole("link", { name: "81999554108" });
    expect(phoneLink).toHaveAttribute("href", "tel:81999554108");

    // Link para detalhe
    const detailLinks = screen.getAllByRole("link");
    const apptLinks = detailLinks.filter((el) => el.getAttribute("href") === "/agenda/apt-1");
    expect(apptLinks.length).toBeGreaterThan(0);
  });

  it("não renderiza link de telefone quando não informado", () => {
    const appointmentNoPhone: Appointment = {
      ...MOCK_APPOINTMENT,
      clinic_phone: null,
    };

    render(
      <MemoryRouter>
        <AppointmentCard appointment={appointmentNoPhone} />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("link", { name: "81999554108" })).not.toBeInTheDocument();
    expect(screen.queryByText(/81999554108/)).not.toBeInTheDocument();
  });

  it("renderiza status neutro para consultas concluídas", () => {
    const appointmentCompleted: Appointment = {
      ...MOCK_APPOINTMENT,
      status: "completed",
    };

    render(
      <MemoryRouter>
        <AppointmentCard appointment={appointmentCompleted} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Concluída")).toBeInTheDocument();
  });

  it("garante que links tel: nunca são aninhados dentro de outros links <a>", () => {
    const { container } = render(
      <MemoryRouter>
        <AppointmentCard appointment={MOCK_APPOINTMENT} />
      </MemoryRouter>,
    );

    const links = container.querySelectorAll("a");
    for (const link of links) {
      expect(link.querySelector("a")).toBeNull();
    }
  });
});
