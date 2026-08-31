import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EducationProgressSummary } from "./EducationProgressSummary";

describe("EducationProgressSummary", () => {
  it("renderiza os dados de progresso e atributos de acessibilidade", () => {
    render(
      <EducationProgressSummary
        progress={{
          completed: 3,
          total: 6,
          percentage: 50,
        }}
      />,
    );

    const progressbar = screen.getByRole("progressbar", {
      name: "Progresso nos módulos educativos",
    });
    expect(progressbar).toBeInTheDocument();
    expect(progressbar).toHaveAttribute("aria-valuenow", "50");
    expect(progressbar).toHaveAttribute("aria-valuemin", "0");
    expect(progressbar).toHaveAttribute("aria-valuemax", "100");

    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("concluído")).toBeInTheDocument();
    expect(screen.getByText("Continue aprendendo!")).toBeInTheDocument();
    expect(screen.getByText("3 de 6 módulos concluídos")).toBeInTheDocument();
    expect(progressbar).not.toContainElement(
      screen.getByRole("heading", { name: "Continue aprendendo!" }),
    );
  });

  it("renderiza estado 100% concluído", () => {
    render(
      <EducationProgressSummary
        progress={{
          completed: 6,
          total: 6,
          percentage: 100,
        }}
      />,
    );

    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("6 de 6 módulos concluídos")).toBeInTheDocument();
  });

  it("lida com zero módulos", () => {
    render(
      <EducationProgressSummary
        progress={{
          completed: 0,
          total: 0,
          percentage: 0,
        }}
      />,
    );

    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText("0 de 0 módulos concluídos")).toBeInTheDocument();
  });
});
