import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ModuleHero } from "./ModuleHero";
import type { EducationModule } from "../types";

const mockModule: EducationModule = {
  id: "mod-1",
  slug: "conexao-boca-coracao",
  title: "A Conexão Entre Boca e Coração",
  description: "Entenda por que a saúde bucal é tão importante.",
  category: "mouth_heart_connection",
  estimated_minutes: 5,
  order_index: 1,
  thumbnail_url: null,
  content: [],
  is_started: false,
  is_completed: false,
  started_at: null,
  completed_at: null,
};

describe("ModuleHero", () => {
  it("renderiza os detalhes do módulo, número do módulo e metadados", () => {
    const { container } = render(<ModuleHero module={mockModule} />);

    expect(screen.getByText("Módulo 1")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "A Conexão Entre Boca e Coração" })).toBeInTheDocument();
    expect(screen.getByText(/5 min/)).toBeInTheDocument();
    expect(screen.getByText(/Conexão boca-coração/)).toBeInTheDocument();
    expect(screen.getByText(/Assista ao vídeo para concluir/i)).toBeInTheDocument();

    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", "/images/education/conexao-boca-coracao.webp");
  });

  it("renderiza o estado de conclusão quando is_completed for verdadeiro", () => {
    render(
      <ModuleHero
        module={{
          ...mockModule,
          is_completed: true,
        }}
      />,
    );

    expect(screen.getByText("Módulo concluído")).toBeInTheDocument();
  });

  it("informa que o vídeo está em breve quando o módulo ainda não o possui", () => {
    render(
      <ModuleHero
        module={{
          ...mockModule,
          slug: "medicamentos-cardiacos-odontologia",
          is_completed: false,
        }}
      />,
    );

    expect(screen.getByText("Vídeo em breve.")).toBeInTheDocument();
    expect(screen.queryByText("Assista ao vídeo para concluir")).not.toBeInTheDocument();
  });
});
