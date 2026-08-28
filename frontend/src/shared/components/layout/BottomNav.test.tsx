import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { BottomNav } from "./BottomNav";

describe("BottomNav", () => {
  it("renderiza todos os links com alvos de toque e acessibilidade", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <BottomNav />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText("Navegação principal")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Início/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /Escovar/i })).toHaveAttribute("href", "/escovar");
    expect(screen.getByRole("link", { name: /Estudar/i })).toHaveAttribute("href", "/educacao");
    expect(screen.getByRole("link", { name: /Agenda/i })).toHaveAttribute("href", "/agenda");
    expect(screen.getByRole("link", { name: /Perfil/i })).toHaveAttribute("href", "/perfil");
  });
});

