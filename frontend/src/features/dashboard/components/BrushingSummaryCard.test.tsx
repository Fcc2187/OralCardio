import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { BrushingSummaryCard } from "./BrushingSummaryCard";

describe("BrushingSummaryCard", () => {
  it("reserva espaço para a ilustração em telas compactas", () => {
    const { container } = render(
      <MemoryRouter>
        <BrushingSummaryCard brushingsToday={0} streakDays={0} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Ainda não escovou").parentElement).toHaveClass("max-w-[7.75rem]", "pr-20");
    expect(container.querySelector('img[src="/images/home/brushing-hero.webp"]')).toHaveClass("h-44");
  });
});
