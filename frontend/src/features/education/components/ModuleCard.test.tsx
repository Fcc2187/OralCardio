import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { ModuleCard } from "./ModuleCard";
import type { EducationModule } from "../types";

const mockModule: EducationModule = {
  id: "mod-1",
  slug: "conexao-boca-coracao",
  title: "A Conexão Entre Boca e Coração",
  description: "Entenda por que a saúde bucal é tão importante para quem tem uma condição cardíaca.",
  category: "mouth_heart_connection",
  estimated_minutes: 5,
  order_index: 1,
  thumbnail_url: null,
  content: { sections: [] },
  is_started: false,
  is_completed: false,
  started_at: null,
  completed_at: null,
};

describe("ModuleCard", () => {
  it("renderiza o card com asset local padrão quando thumbnail_url é nulo", () => {
    const { container } = render(
      <MemoryRouter>
        <ModuleCard module={mockModule} />
      </MemoryRouter>,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/educacao/conexao-boca-coracao");
    expect(screen.getByText("A Conexão Entre Boca e Coração")).toBeInTheDocument();
    expect(screen.getByText(/Entenda por que a saúde bucal é tão importante/)).toBeInTheDocument();
    expect(screen.getByText(/5 min/)).toBeInTheDocument();
    expect(screen.getByText(/Conexão boca-coração/)).toBeInTheDocument();

    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", "/images/education/conexao-boca-coracao.webp");
  });

  it("usa thumbnail HTTPS válida quando fornecida pela API", () => {
    const { container } = render(
      <MemoryRouter>
        <ModuleCard
          module={{
            ...mockModule,
            thumbnail_url: "https://example.com/custom-image.webp",
          }}
        />
      </MemoryRouter>,
    );

    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", "https://example.com/custom-image.webp");
  });

  it("rejeita thumbnail insegura ou inválida e usa asset local", () => {
    const { container } = render(
      <MemoryRouter>
        <ModuleCard
          module={{
            ...mockModule,
            thumbnail_url: "http://insecure.com/img.png",
          }}
        />
      </MemoryRouter>,
    );

    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", "/images/education/conexao-boca-coracao.webp");
  });

  it("exibe badge de concluído quando is_completed for verdadeiro", () => {
    render(
      <MemoryRouter>
        <ModuleCard
          module={{
            ...mockModule,
            is_completed: true,
            is_started: true,
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Concluído")).toBeInTheDocument();
  });

  it("anuncia o status concluído uma única vez no link", () => {
    render(
      <MemoryRouter>
        <ModuleCard
          module={{
            ...mockModule,
            is_completed: true,
            is_started: true,
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link")).toHaveAccessibleName(
      "A Conexão Entre Boca e Coração (Concluído) Entenda por que a saúde bucal é tão importante para quem tem uma condição cardíaca. 5 min Conexão boca-coração",
    );
  });

  it("exibe badge de em andamento quando is_started for verdadeiro e is_completed for falso", () => {
    render(
      <MemoryRouter>
        <ModuleCard
          module={{
            ...mockModule,
            is_started: true,
            is_completed: false,
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Em andamento")).toBeInTheDocument();
  });

  it("não exibe status de bloqueado", () => {
    render(
      <MemoryRouter>
        <ModuleCard module={mockModule} />
      </MemoryRouter>,
    );

    expect(screen.queryByText(/bloqueado/i)).not.toBeInTheDocument();
  });
});
