import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { SidebarNav } from "./SidebarNav";

describe("SidebarNav", () => {
  it("renderiza todos os destinos de navegação e acessibilidade", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <SidebarNav />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText("Navegação principal")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Início/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /Escovar/i })).toHaveAttribute("href", "/escovar");
    expect(screen.getByRole("link", { name: /Estudar/i })).toHaveAttribute("href", "/educacao");
    expect(screen.getByRole("link", { name: /Agenda/i })).toHaveAttribute("href", "/agenda");
    expect(screen.getByRole("link", { name: /Perfil/i })).toHaveAttribute("href", "/perfil");
    expect(screen.getByText("OralCardio")).toBeInTheDocument();
  });
});

