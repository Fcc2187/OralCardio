import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BrushingProgressCard } from "./BrushingProgressCard";

describe("BrushingProgressCard", () => {
  it("renderiza acessibilidade da barra de progresso com porcentagem", () => {
    render(<BrushingProgressCard progressPercent={45} />);

    const progress = screen.getByRole("progressbar", { name: "Progresso da escovação" });
    expect(progress).toHaveAttribute("aria-valuenow", "45");
    expect(progress).toHaveAttribute("aria-valuemin", "0");
    expect(progress).toHaveAttribute("aria-valuemax", "100");
    expect(screen.getByText("45%")).toBeInTheDocument();
    expect(screen.getByText("Escovação completa")).toBeInTheDocument();
  });
});
