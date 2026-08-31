import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { ModuleCompletionCard } from "./ModuleCompletionCard";

describe("ModuleCompletionCard", () => {
  it("renderiza o link para o próximo módulo quando nextModuleSlug for informado", () => {
    render(
      <MemoryRouter>
        <ModuleCompletionCard nextModuleSlug="o-que-e-bacteremia" />
      </MemoryRouter>,
    );

    expect(screen.getByText("Módulo concluído!")).toBeInTheDocument();
    expect(screen.getByText(/Continue aprendendo e cuide ainda mais/)).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /Ver próximos/i });
    expect(link).toHaveAttribute("href", "/educacao/o-que-e-bacteremia");
  });

  it("renderiza o link 'Voltar aos módulos' quando for o último módulo", () => {
    render(
      <MemoryRouter>
        <ModuleCompletionCard nextModuleSlug={null} />
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", { name: /Voltar aos módulos/i });
    expect(link).toHaveAttribute("href", "/educacao");
  });
});
